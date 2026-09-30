from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal


async def get_db() -> AsyncGenerator[AsyncSession]:
    """每请求一个独立 session; 正常结束统一 commit, 异常 rollback.

    commit 放在 yield 之后(端点已返回响应), 端点内只需 flush 提前暴露约束错误.
    只读端点也 commit(额外往返但无害), 保证 flush 的对象在 session 内可见.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
