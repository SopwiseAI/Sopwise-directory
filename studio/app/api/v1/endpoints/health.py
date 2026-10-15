import asyncio
import logging

from fastapi import APIRouter, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_app_version
from app.core.database import engine
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthResponse}},
)
async def health_check(response: Response) -> HealthResponse:
    """探活: 200 表示库可用, 503 表示库不可用。

    探活必须如实反映"能不能干活", 所以:
      - 用 engine.connect() 直连而不是走请求 session: 只是发一条 SELECT 1, 不该
        为它开一个事务或受 session 生命周期影响
      - 捕获 SQLAlchemyError(DBAPIError 只是它的子类)而不是只捕 DBAPIError ——
        连接池取连接超时抛的是 sqlalchemy.exc.TimeoutError, 它不属于 DBAPIError,
        漏掉就会把"库连不上"报成 500, 让监控以为是代码 bug
      - TimeoutError 在 3.11+ 是 OSError 的子类, 用 asyncio.timeout 兜住卡死的连接
    """
    try:
        async with asyncio.timeout(5):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="connected", brand="XiGee", version=get_app_version())
    except (SQLAlchemyError, OSError) as exc:
        # 只记原因, 不回给调用方: 探测接口的响应体应该是稳定的结构化字段
        logger.warning("Health check failed: %s", exc)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="disconnected", brand="XiGee", version=get_app_version())
