import asyncio
import logging

from fastapi import APIRouter, Response, status
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

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
    try:
        async with asyncio.timeout(5):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="connected", brand="Sopwise", version=get_app_version())
    except (DBAPIError, OSError) as exc:
        logger.warning("Health check failed: %s", exc)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="disconnected", brand="Sopwise", version=get_app_version())
