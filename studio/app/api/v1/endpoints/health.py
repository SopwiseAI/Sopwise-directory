import asyncio
import logging

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import DBAPIError

from app.core.config import get_app_version
from app.core.database import engine

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health_check() -> JSONResponse:
    try:
        async with asyncio.timeout(5):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"status": "ok", "database": "connected", "brand": "Sopwise", "version": get_app_version()},
        )
    except (DBAPIError, TimeoutError, OSError) as exc:
        logger.warning("Health check failed: %s", exc)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "status": "degraded",
                "database": "disconnected",
                "brand": "Sopwise",
                "version": get_app_version(),
            },
        )
