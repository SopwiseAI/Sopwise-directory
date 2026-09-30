"""健康检查端点测试。"""

from unittest.mock import patch

import pytest
from sqlalchemy.exc import OperationalError


@pytest.mark.asyncio
async def test_health_returns_ok(async_client):
    resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "database" in data
    assert data["brand"] == "Sopwise"
    assert "version" in data


@pytest.mark.asyncio
async def test_health_declares_response_model(async_client):
    """/health 应声明 HealthResponse, 且 503 也文档化同一模型。"""
    resp = await async_client.get("/openapi.json")
    schemas = resp.json()["components"]["schemas"]
    assert "HealthResponse" in schemas
    assert set(schemas["HealthResponse"]["properties"]) == {"status", "database", "brand", "version"}
    responses = resp.json()["paths"]["/api/v1/health"]["get"]["responses"]
    assert "503" in responses


@pytest.mark.asyncio
async def test_health_returns_503_on_timeout(async_client):
    """超时(TimeoutError 是 OSError 子类)也应返回 503 degraded。"""
    with patch("app.api.v1.endpoints.health.engine") as mock_engine:
        mock_engine.connect.side_effect = TimeoutError("mock timeout")
        resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"


@pytest.mark.asyncio
async def test_health_status_is_ok_when_db_connected(async_client):
    resp = await async_client.get("/api/v1/health")
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


@pytest.mark.asyncio
async def test_health_db_disconnected(async_client):
    """当数据库不可用时返回 503 degraded。"""
    with patch("app.api.v1.endpoints.health.engine") as mock_engine:
        mock_engine.connect.side_effect = OperationalError("mock", "mock", "mock")
        resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 503
    data = resp.json()
    assert data["status"] == "degraded"
    assert data["database"] == "disconnected"
