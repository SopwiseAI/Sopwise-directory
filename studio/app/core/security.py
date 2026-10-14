import logging
import secrets

from fastapi import HTTPException, Request, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

logger = logging.getLogger(__name__)

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(request: Request, api_key: str = Security(api_key_header)) -> str:
    settings = get_settings()
    # compare_digest 而不是 ==: 长度不等的短路比较会泄露密钥长度
    if not api_key or not secrets.compare_digest(api_key.encode("utf-8"), settings.api_key.encode("utf-8")):
        # 记一条: 没有它, 撞库和"前端密钥配错"在服务端是完全静默的。
        # 只记方法与路径, 【不记】收到的密钥值(日志会被收集、轮转、共享)
        logger.warning("API key rejected on %s %s", request.method, request.url.path)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            # 401 按 RFC 9110 必须带 WWW-Authenticate, 否则调用方不知道该怎么补凭证
            headers={"WWW-Authenticate": "ApiKey"},
            detail="Invalid or missing API key",
        )
    return api_key


async def require_write(_: str = Security(verify_api_key)) -> None:
    """Write operations (POST/PUT/DELETE) require API key."""
