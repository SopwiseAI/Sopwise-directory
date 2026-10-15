"""写端点的鉴权面: 所有 POST/PUT/DELETE 都必须要求 API Key。

读端点(/health /env 以及 GET /topics /tools)刻意不要 Key, 所以这里只覆盖写路由。
补这组用例的原因: 之前只有 /export 有 401 用例, 整条写鉴权面是裸奔的 ——
某个端点漏挂 require_write 不会被任何测试发现。
"""

from typing import Any

import pytest

_MINIMAL_TOOL: dict[str, Any] = {
    "slug": "auth-tool",
    "name": "鉴权工具",
    "tagline": "用于鉴权用例。",
    "pricing": "free",
    "origin": "cn",
    "access": "direct",
    "languages": ["zh"],
}

_WRITE_ROUTES: list[tuple[str, str, dict[str, Any] | None]] = [
    ("post", "/api/v1/topics", {"slug": "auth-topic", "name": "鉴权主题"}),
    ("put", "/api/v1/topics/1", {"name": "改名"}),
    ("delete", "/api/v1/topics/1", None),
    ("post", "/api/v1/tools", _MINIMAL_TOOL),
    ("put", "/api/v1/tools/1", {"name": "改名"}),
    ("delete", "/api/v1/tools/1", None),
    ("post", "/api/v1/tools/1/links", {"url": "https://example.com"}),
    ("put", "/api/v1/tools/1/links/1", {"label": "api"}),
    ("delete", "/api/v1/tools/1/links/1", None),
    ("put", "/api/v1/tools/1/topics", {"topic_ids": []}),
    ("post", "/api/v1/export", None),
]

_ROUTE_IDS = [f"{method.upper()} {path}" for method, path, _ in _WRITE_ROUTES]


@pytest.mark.parametrize("headers", [{}, {"X-API-Key": "wrong"}], ids=["missing-key", "wrong-key"])
@pytest.mark.parametrize(("method", "path", "payload"), _WRITE_ROUTES, ids=_ROUTE_IDS)
async def test_write_endpoints_require_api_key(anon_client, method, path, payload, headers):
    """写路由要么没带 Key, 要么带了错的 Key —— 都必须 401, 且不能落库。"""
    request = getattr(anon_client, method)
    if payload is not None:
        resp = await request(path, json=payload, headers=headers)
    else:
        resp = await request(path, headers=headers)
    assert resp.status_code == 401, f"{method.upper()} {path} -> {resp.status_code}: {resp.text}"


@pytest.mark.parametrize("path", ["/api/v1/health", "/api/v1/env", "/api/v1/topics", "/api/v1/tools"])
async def test_read_endpoints_stay_public(anon_client, path):
    """读端点是公开的: 别顺手给它们也加上 Key 要求。"""
    resp = await anon_client.get(path)
    assert resp.status_code == 200, f"GET {path} -> {resp.status_code}: {resp.text}"


async def test_write_without_key_leaves_no_row(async_client, anon_client):
    """401 必须发生在写库之前: 无 Key 的 POST 不能留下任何数据。"""
    resp = await anon_client.post("/api/v1/topics", json={"slug": "unauthorized-topic", "name": "未授权"})
    assert resp.status_code == 401

    resp = await async_client.get("/api/v1/topics")
    assert resp.json() == []
