"""健康检查端点测试。"""

from unittest.mock import AsyncMock

import pytest
from sqlalchemy.exc import OperationalError

from app.core.deps import get_db
from app.main import app


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
    mock_session = AsyncMock()
    mock_session.execute.side_effect = OperationalError("mock", "mock", "mock")

    async def override_get_db():
        yield mock_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        resp = await async_client.get("/api/v1/health")
        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "degraded"
        assert data["database"] == "disconnected"
    finally:
        app.dependency_overrides.pop(get_db, None)
