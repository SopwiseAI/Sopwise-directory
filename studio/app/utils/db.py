from collections.abc import Collection, Iterable
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import ColumnElement, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import InstrumentedAttribute

from app.models import LinkStatus, Tool, ToolLink, ToolStatus, ToolTopic, Topic


def drop_none(data: dict[str, Any], *, keep_none: Collection[str] = ()) -> dict[str, Any]:
    """移除显式 None 值。

    `model_dump(exclude_unset=True)` 仍会保留显式传入的 null; 对非空字段
    (NOT NULL / 枚举) 这类值会导致 500 或语义错误的 409。`keep_none` 中的
    字段保留 None, 用于"清空可空字段"。
    """
    keep = set(keep_none)
    return {key: value for key, value in data.items() if value is not None or key in keep}


async def check_unique(
    db: AsyncSession,
    model: type[Tool] | type[Topic],
    field: InstrumentedAttribute[str],
    value: str,
    *,
    exclude_id: int | None = None,
    label: str = "Field",
) -> None:
    """值已存在时抛 409, 否则放行。

    先查再写是为了拿到可读的错误(库里的 UNIQUE 只会回一句 Duplicate entry, 前端拿不到
    是哪个字段); 真正的唯一性仍由 xg_tool / xg_topic 的 UNIQUE 键兜底 —— 查与写之间
    的竞态窗口就交给它。

    Args:
        model: SQLAlchemy 模型类。只列 Tool / Topic —— 它们都带自增 id 且都有字符串
               唯一列。写成 type[DeclarativeBase] 会让 model.id 变成未定义属性(mypy
               报 attr-defined), 而用一个泛型 Protocol 去描述"有 id 的模型类"在这里
               只是把断言换个地方藏起来。
        field: 要检查的列(只支持字符串列, 枚举列的取值由 schema 层保证)
        value: 待检查的值
        exclude_id: 更新场景下排除自身这一行
        label: 错误信息里的字段名
    """
    stmt = select(model.id).where(field == value)
    if exclude_id is not None:
        stmt = stmt.where(model.id != exclude_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{label} already exists",
        )


def active_link_exists() -> ColumnElement[bool]:
    """相关子查询:该工具存在 status='active' 的链接。

    抽出来是为了让 /topics 与 /tools 的计数口径只写一次。注意导出器【不用】它:
    导出端的 toolCount 是在最终的 tools[] 上就地聚合的(见 json_exporter._fill_tool_counts),
    比再跑一条 SQL 更能保证"徽标数与主题页条数"逐字一致。
    """
    return select(ToolLink.id).where(ToolLink.tool_id == Tool.id, ToolLink.status == LinkStatus.ACTIVE).exists()


async def published_tool_counts(db: AsyncSession, topic_ids: Iterable[int]) -> dict[int, int]:
    """批量统计各主题下【会出现在 tools[] 里】的工具数, 返回 {topic_id: count}。

    成员规则与 studio/sql/schema.sql 的【导出投影】逐字一致:
        status='published' AND 存在 status='active' 的链接
    少任何一个条件,导出的 toolCount 就会和主题页实际条数对不上。

    按关联行统计,不看主题自己是不是 active —— 禁用主题不进导出,所以这里多算的那点
    不会出现在产物里。传入空集合时直接返回 {},不产生无意义的 IN () 查询。
    """
    ids = set(topic_ids)
    if not ids:
        return {}
    stmt = (
        select(ToolTopic.topic_id, func.count().label("cnt"))
        .join(Tool, Tool.id == ToolTopic.tool_id)
        .where(
            ToolTopic.topic_id.in_(ids),
            Tool.status == ToolStatus.PUBLISHED,
            active_link_exists(),
        )
        .group_by(ToolTopic.topic_id)
    )
    rows = await db.execute(stmt)
    return {row.topic_id: row.cnt for row in rows}
