from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas.common import EnvResponse

router = APIRouter()


@router.get("/env", response_model=EnvResponse)
async def env_info() -> EnvResponse:
    settings = get_settings()
    return EnvResponse(env=settings.app_env, debug=settings.app_debug)
