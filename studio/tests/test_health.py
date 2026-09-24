"""健康检查端点测试。"""

import pytest


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
