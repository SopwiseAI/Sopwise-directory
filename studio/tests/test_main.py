import pytest
from httpx import AsyncClient
from starlette.requests import Request

from app.main import global_exception_handler


@pytest.mark.asyncio
async def test_cors_exposes_pagination_and_request_id_headers(anon_client: AsyncClient):
    """分页总数与请求 id 需通过 CORS expose_headers 暴露给浏览器。"""
    resp = await anon_client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 200
    exposed = resp.headers.get("access-control-expose-headers", "")
    assert "X-Total-Count" in exposed
    assert "X-Request-ID" in exposed


@pytest.mark.asyncio
async def test_global_exception_handler_attaches_request_id():
    """500 兜底响应应带上 X-Request-ID 以便与日志关联。

    直接单测 handler: 该 handler 挂在最外层 ServerErrorMiddleware, 而 dev 下
    debug=True 会绕过 handler 返回 traceback, 无法通过 ASGI 请求观测。
    """
    request = Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/boom",
            "headers": [],
            "query_string": b"",
            "state": {"request_id": "deadbeef"},
        }
    )
    resp = await global_exception_handler(request, RuntimeError("boom"))
    assert resp.status_code == 500
    assert resp.headers["X-Request-ID"] == "deadbeef"
    assert resp.body == b'{"detail":"Internal server error"}'
