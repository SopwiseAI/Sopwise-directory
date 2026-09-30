"""环境信息端点测试。"""

import pytest


@pytest.mark.asyncio
async def test_env_returns_fields(async_client):
    resp = await async_client.get("/api/v1/env")
    assert resp.status_code == 200
    data = resp.json()
    assert "env" in data
    assert "debug" in data


@pytest.mark.asyncio
async def test_env_response_enum_restricted(async_client):
    """EnvResponse.env 限定为 dev/sit/prod, OpenAPI 中应体现为 enum。"""
    resp = await async_client.get("/openapi.json")
    schema = resp.json()["components"]["schemas"]["EnvResponse"]["properties"]["env"]
    assert schema["enum"] == ["dev", "sit", "prod"]


@pytest.mark.asyncio
async def test_env_does_not_leak_db_info(async_client):
    resp = await async_client.get("/api/v1/env")
    data = resp.json()
    assert "db_host" not in data
    assert "db_name" not in data
    assert "db_password" not in data
