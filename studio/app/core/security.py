import secrets

from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

from app.core.config import get_settings

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(api_key: str = Security(api_key_header)) -> str:
    settings = get_settings()
    # compare_digest 而不是 ==: 长度不等的短路比较会泄露密钥长度
    if not api_key or not secrets.compare_digest(api_key.encode("utf-8"), settings.api_key.encode("utf-8")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            # 401 按 RFC 9110 必须带 WWW-Authenticate, 否则调用方不知道该怎么补凭证
            headers={"WWW-Authenticate": "ApiKey"},
            detail="Invalid or missing API key",
        )
    return api_key


async def require_write(_: str = Security(verify_api_key)) -> None:
    """Write operations (POST/PUT/DELETE) require API key."""
