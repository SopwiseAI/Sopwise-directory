"""健康检查端点测试。"""

import logging
from unittest.mock import patch

from sqlalchemy.exc import OperationalError

from app.api.v1.endpoints.health import _HEALTH_TIMEOUT_SECONDS


async def test_health_returns_ok(async_client):
    resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "status" in data
    assert "database" in data
    assert data["brand"] == "XiGee"
    assert "version" in data


async def test_health_declares_response_model(async_client):
    """/health 应声明 HealthResponse, 且 503 也文档化同一模型。"""
    resp = await async_client.get("/openapi.json")
    schemas = resp.json()["components"]["schemas"]
    assert "HealthResponse" in schemas
    assert set(schemas["HealthResponse"]["properties"]) == {"status", "database", "brand", "version"}
    responses = resp.json()["paths"]["/api/v1/health"]["get"]["responses"]
    assert "503" in responses


async def test_health_returns_503_on_timeout(async_client):
    """超时(TimeoutError 是 OSError 子类)也应返回 503 degraded。"""
    with patch("app.api.v1.endpoints.health.engine") as mock_engine:
        mock_engine.connect.side_effect = TimeoutError("mock timeout")
        resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"


async def test_health_status_is_ok_when_db_connected(async_client):
    resp = await async_client.get("/api/v1/health")
    data = resp.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"


async def test_health_db_disconnected(async_client):
    """当数据库不可用时返回 503 degraded。"""
    with patch("app.api.v1.endpoints.health.engine") as mock_engine:
        # 第三个参数是 DBAPI 原始异常(SQLAlchemy 就是这么包的), 传字符串的话
        # 任何读 exc.orig.args 的处理器都会 AttributeError —— 用真异常才模拟得像
        mock_engine.connect.side_effect = OperationalError("mock", {}, Exception("mock"))
        resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 503
    data = resp.json()
    assert data["status"] == "degraded"
    assert data["database"] == "disconnected"


def test_health_timeout_budget_covers_cold_start():
    """探活预算必须容得下冷启动的首次建连。

    进程起来后的第一次 engine.connect() 要把 SQLAlchemy 的方言探测跑完(一串串行往返),
    实测 RTT ≈0.4s 的链路上是 6.1s, 池子热了之后才 1.4s。5s 的预算会把完全健康的库报成
    degraded, 而且超时取消掉那次建连、方言探测等于白跑, 于是每次重试都要重走冷路径
    —— 只要这段时间只有探活请求打进来就永远自愈不了(实测连续 11 次 503)。
    这个预算还是"库连不上"时的【唯一】上界(aiomysql 的 connect_timeout 默认 None,
    asyncio.wait_for(timeout=None) 等于不设限), 所以也不能没有下界 —— 钉住它别再被调回 5s。
    """
    assert _HEALTH_TIMEOUT_SECONDS >= 10


async def test_health_timeout_logs_reason(async_client, caplog):
    """超时分支的日志必须能读出"是超时"。

    asyncio.timeout 抛的是【无参】TimeoutError, str(exc) == "" —— 让它落进
    `logger.warning("Health check failed: %s", exc)` 只会打出一行没有原因的
    "Health check failed: ", 恰好把最该知道的信息丢掉。所以这里钉住日志内容。
    """
    with (
        caplog.at_level(logging.WARNING, logger="app.api.v1.endpoints.health"),
        patch("app.api.v1.endpoints.health.engine") as mock_engine,
    ):
        mock_engine.connect.side_effect = TimeoutError()
        resp = await async_client.get("/api/v1/health")
    assert resp.status_code == 503
    assert resp.json()["status"] == "degraded"
    assert "timed out" in caplog.text
