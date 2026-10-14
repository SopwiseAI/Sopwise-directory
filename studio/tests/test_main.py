import pytest
from httpx import AsyncClient
from sqlalchemy.exc import OperationalError
from sqlalchemy.exc import TimeoutError as SATimeoutError
from starlette.requests import Request

from app.main import database_unavailable_handler, global_exception_handler


def _request() -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/boom",
            "headers": [],
            "query_string": b"",
            "state": {"request_id": "deadbeef"},
        }
    )


def _op_error(code: int, message: str) -> OperationalError:
    """仿 pymysql 的错误对象: orig.args[0] 就是 MySQL 错误码。"""
    return OperationalError("SELECT 1", {}, Exception(code, message))


async def test_cors_exposes_pagination_and_request_id_headers(anon_client: AsyncClient):
    """分页总数与请求 id 需通过 CORS expose_headers 暴露给浏览器。"""
    resp = await anon_client.get("/api/v1/health", headers={"Origin": "http://localhost:3000"})
    assert resp.status_code == 200
    exposed = resp.headers.get("access-control-expose-headers", "")
    assert "X-Total-Count" in exposed
    assert "X-Request-ID" in exposed


async def test_validation_error_keeps_fastapi_default_shape(anon_client: AsyncClient):
    """422 必须是 FastAPI 默认形态: detail 是错误对象数组。

    我们刻意【不】注册 RequestValidationError 处理器。曾经把它拍平成
    "path.topic_id: Input should be ..." 一根字符串 —— 人读着顺, 但生成的
    OpenAPI 里 422 仍然指向 HTTPValidationError, 照契约写的客户端会解析失败。
    这条用例同时钉住"响应形态"和"OpenAPI 声明"两边。
    """
    resp = await anon_client.get("/api/v1/topics/not-an-int")
    assert resp.status_code == 422

    detail = resp.json()["detail"]
    assert isinstance(detail, list)
    assert {"loc", "msg", "type"} <= set(detail[0])
    assert detail[0]["loc"][-1] == "topic_id"


async def test_global_exception_handler_attaches_request_id():
    """500 兜底响应应带上 X-Request-ID 以便与日志关联。

    直接单测 handler: 该 handler 挂在最外层 ServerErrorMiddleware, 而 dev 下
    debug=True 会绕过 handler 返回 traceback, 无法通过 ASGI 请求观测。
    """
    resp = await global_exception_handler(_request(), RuntimeError("boom"))
    assert resp.status_code == 500
    assert resp.headers["X-Request-ID"] == "deadbeef"
    assert resp.body == b'{"detail":"Internal server error"}'


# ── OperationalError 的两条岔路 ───────────────────────────────────────────────


@pytest.mark.parametrize("code", [1054, 1146])
async def test_schema_mismatch_is_500_not_503(code: int):
    """库结构没跟上(少了迁移)必须回 500。

    实测 SELECT 一个不存在的列抛的就是 OperationalError 1054 —— 只看异常类型会
    把它当成"库抖动, 请重试", 而重试一万次也不会好。
    """
    resp = await database_unavailable_handler(_request(), _op_error(code, "Unknown column 'x'"))
    assert resp.status_code == 500
    assert resp.body == b'{"detail":"Database schema is out of date"}'
    assert resp.headers["X-Request-ID"] == "deadbeef"


async def test_connection_failure_is_still_503():
    resp = await database_unavailable_handler(_request(), _op_error(2003, "Can't connect to MySQL server"))
    assert resp.status_code == 503
    assert resp.body == b'{"detail":"Database unavailable, please retry"}'


async def test_pool_timeout_is_503():
    """连接池取不到连接没有 MySQL 错误码, 仍按"依赖暂时不可用"处理。"""
    resp = await database_unavailable_handler(_request(), SATimeoutError("QueuePool limit reached"))
    assert resp.status_code == 503
    assert resp.headers["X-Request-ID"] == "deadbeef"
