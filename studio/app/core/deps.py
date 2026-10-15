from collections.abc import AsyncGenerator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession]:
    """每请求一个独立 session; 正常结束统一 commit, 异常 rollback。

    端点里只需要 flush 提前暴露约束错误, 不需要自己 commit。
    只读端点也会 commit: 事务要不要写只有 commit 那一刻才知道, 而多一次
    COMMIT 比"某个只读端点偶然写了东西却没提交"便宜得多。
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# 端点一律用这个别名取 session, 而不是自己写 Depends(get_db)。
#
# scope="function" 是关键: 依赖的收尾代码(commit)会在端点函数返回后、
# 【响应尚未发出】时执行。默认的 request 作用域要等响应发给客户端之后才收尾,
# 于是"flush 都过了但 commit 才失败"(并发撞唯一键、死锁、锁等待超时)既回滚了
# 数据、又已经把一个 201 发给了客户端 —— 上层的 IntegrityError 处理器想回 409
# 也已经来不及(Starlette 只会报 "response already started")。收到 "Duplicate entry"
# 却拿到 201, 是比 500 更难查的一类 bug。
DbSession = Annotated[AsyncSession, Depends(get_db, scope="function")]
