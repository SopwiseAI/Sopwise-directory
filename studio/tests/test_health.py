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
