"""工具链接端点 + 工具主题归属端点(两者都挂在 /tools 前缀下)。

链接的三条坑:
  1. 写链接必须落 url / url_hash 两列(见 tools.normalize_link_url): url 是【归一化后】
     的值, url_hash 基于它算, (tool_id, url_hash) 是唯一键 —— 所以任何写入点都不能
     把客户端给的原始串直接塞进 url
  2. 每个工具至多一个主链接, 这条【只由 API 保证】——schema.sql 精简后库层已经没有
     uk_tl_primary 之类的东西了。所以换主链接时除了"先清旧主", 还必须先用
     tools.lock_tool_row 锁住父行: 两个并发请求各自读到"没有主链接"再各插一条,
     没有任何索引会拦下来, 结果就是导出时 tools[].url 取哪个全看运气
  3. label 是 NOT NULL:显式传 null 要忽略掉,不能写进库里
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.endpoints.tools import (
    lock_tool_row,
    normalize_link_url,
    ordered_topic_ids,
    replace_tool_topics,
)
from app.core.deps import DbSession
from app.core.security import require_write
from app.models import LinkStatus, ToolLink, ToolTopic
from app.schemas.models import (
    ToolLinkCreate,
    ToolLinkResponse,
    ToolLinkUpdate,
    ToolTopicsResponse,
    ToolTopicsUpdate,
)
from app.utils.db import drop_none

router = APIRouter()


async def _clear_primary_link(db: AsyncSession, tool_id: int, *, exclude_id: int | None = None) -> None:
    """把该工具已有的主链接降级为非主, 并立刻 flush。

    调用方必须已经持有 lock_tool_row 的锁, 否则这里读到的"旧主链接"可能是过期的。

    加锁读(FOR UPDATE)而不是普通 SELECT: 本事务的快照可能停在加锁之前,
    而这份快照要决定"哪些行该被降级", 读旧了就会漏掉并发写者刚提交的那一行。
    flush 则是为了让"旧主已落库为 0"先于任何新行插入。
    """
    stmt = select(ToolLink).where(ToolLink.tool_id == tool_id, ToolLink.is_primary.is_(True)).with_for_update()
    if exclude_id is not None:
        stmt = stmt.where(ToolLink.id != exclude_id)
    for existing in (await db.execute(stmt)).scalars().all():
        existing.is_primary = False
    await db.flush()


@router.get("/{tool_id}/links", response_model=list[ToolLinkResponse])
async def list_tool_links(
    tool_id: int,
    db: DbSession,
    status_filter: LinkStatus | None = Query(None, alias="status"),
) -> list[ToolLink]:
    # 刻意不校验工具是否存在: 未知工具返回 [], 而不是 404(见 tests 里的用例)。
    # 这是纯读接口, 空列表和"工具没有链接"对调用方是同一个意思, 不值得多一次查询。
    stmt = select(ToolLink).where(ToolLink.tool_id == tool_id)
    if status_filter is not None:
        stmt = stmt.where(ToolLink.status == status_filter)
    stmt = stmt.order_by(ToolLink.sort_order.desc(), ToolLink.id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/{tool_id}/links",
    response_model=ToolLinkResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write)],
)
async def add_tool_link(tool_id: int, data: ToolLinkCreate, db: DbSession) -> ToolLink:
    # 存在性检查和加锁合成一条语句: 下面既可能写 is_primary, 又要读旧链接查重
    await lock_tool_row(db, tool_id)

    normalized, new_hash = normalize_link_url(data.url)
    existing = await db.execute(
        select(ToolLink).where(
            ToolLink.tool_id == tool_id,
            ToolLink.url_hash == new_hash,
        )
    )
    if existing.scalar_one_or_none():
        # 提前查一次只是为了给出可读的 409; 真正的守卫是 uk_tl_url, 并发撞上时
        # 由 flush 抛 IntegrityError, main.py 的处理器同样回 409
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="URL already exists in this tool")

    if data.is_primary:
        # 设新的主链接就把旧的取消掉,而不是返回 409:接口语义是 upsert 主链接
        await _clear_primary_link(db, tool_id)

    link = ToolLink(
        tool_id=tool_id,
        url=normalized,
        url_hash=new_hash,
        label=data.label,
        is_primary=data.is_primary,
        status=data.status,
        sort_order=data.sort_order,
    )
    db.add(link)
    # refresh 取回库端生成的 created_at / updated_at(异步 session 不会惰性补查)
    await db.flush()
    await db.refresh(link)
    return link


@router.put(
    "/{tool_id}/links/{link_id}",
    response_model=ToolLinkResponse,
    dependencies=[Depends(require_write)],
)
async def update_tool_link(tool_id: int, link_id: int, data: ToolLinkUpdate, db: DbSession) -> ToolLink:
    # 先锁父行再读子行: 换主链接要在这把锁的保护下做, 加锁顺序统一"先父后子"
    await lock_tool_row(db, tool_id)

    link = await db.get(ToolLink, link_id)
    if not link or link.tool_id != tool_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    # 不保留任何 None:status / label 都是 NOT NULL, 显式 null 只能忽略
    update_data = drop_none(data.model_dump(exclude_unset=True))

    if "url" in update_data:
        # 客户端发的是原始输入, 库里存的是归一化值 —— 两边必须在同一口径下比较,
        # 否则同一个地址换个写法(带 www. / 尾斜杠 / fragment)就会被当成"改了",
        # 白重算一次并触发 ON UPDATE CURRENT_TIMESTAMP
        normalized, new_hash = normalize_link_url(update_data["url"])
        if normalized != link.url:
            existing = await db.execute(
                select(ToolLink).where(
                    ToolLink.tool_id == tool_id,
                    ToolLink.url_hash == new_hash,
                    ToolLink.id != link_id,
                )
            )
            if existing.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="URL already exists in this tool")
            # url 与 url_hash 必须成对更新:只改 url 会让 hash 停在旧值,
            # 唯一键 (tool_id, url_hash) 和导出值就各自说各话了
            link.url = normalized
            link.url_hash = new_hash

    for key, value in update_data.items():
        if key not in ("url", "is_primary"):
            setattr(link, key, value)

    if update_data.get("is_primary") is True:
        # 顺序不能反: 先把别人降级并 flush, 再把自己设成主
        await _clear_primary_link(db, tool_id, exclude_id=link_id)
        link.is_primary = True
    elif update_data.get("is_primary") is False:
        link.is_primary = False

    await db.flush()
    await db.refresh(link)
    return link


@router.delete(
    "/{tool_id}/links/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_write)],
)
async def delete_tool_link(tool_id: int, link_id: int, db: DbSession) -> None:
    await lock_tool_row(db, tool_id)

    link = await db.get(ToolLink, link_id)
    if not link or link.tool_id != tool_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    # 删掉主链接后允许"零主链接": 不变量是【至多】一个, 导出端会按
    # sort_order DESC, id ASC 回退取首个 active 链接, 所以不需要在这里补选一个
    await db.delete(link)
    await db.flush()


@router.put(
    "/{tool_id}/topics",
    response_model=ToolTopicsResponse,
    dependencies=[Depends(require_write)],
)
async def update_tool_topics(tool_id: int, data: ToolTopicsUpdate, db: DbSession) -> ToolTopicsResponse:
    """整体替换工具的主题归属(全量语义:没列进来的主题就被摘掉)。"""
    # 存在性检查与加锁都在 replace_tool_topics 内部(它是"至多一个主主题"的
    # 唯一收口点), 不存在的工具在那里就会 404, 这里不必再查一遍
    await replace_tool_topics(
        db,
        tool_id,
        topic_ids=data.topic_ids,
        primary_topic_id=data.primary_topic_id,
    )
    # 回读而不是直接回显请求: 主主题可能是"保留原有的"或"默认第一个", 请求里
    # 根本看不出来。注意 topic_ids[0] 【只在确实存在主主题时】才等于主主题 ——
    # 零主主题时它只是排序最靠前的那个, 所以 primary_topic_id 必须单独回填,
    # 不能让前端从 topic_ids[0] 反推。
    topic_ids = await ordered_topic_ids(db, tool_id)
    primary_topic_id = (
        await db.execute(select(ToolTopic.topic_id).where(ToolTopic.tool_id == tool_id, ToolTopic.is_primary == 1))
    ).scalar_one_or_none()
    return ToolTopicsResponse(tool_id=tool_id, topic_ids=topic_ids, primary_topic_id=primary_topic_id)
