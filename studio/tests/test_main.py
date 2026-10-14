import json

import pytest
from httpx import AsyncClient
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.exc import TimeoutError as SATimeoutError
from starlette.requests import Request

from app.main import (
    _request_id_of,
    database_unavailable_handler,
    global_exception_handler,
    integrity_error_handler,
)


def _request(request_id: str | None = "deadbeef") -> Request:
    state = {} if request_id is None else {"request_id": request_id}
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/boom",
            "headers": [],
            "query_string": b"",
            "state": state,
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


async def test_handlers_degrade_gracefully_without_request_id():
    """中间件还没挂上 state 就抛(例如中间件自己出错)时, 头里退化成 "-" 而不是崩。"""
    resp = await global_exception_handler(_request(request_id=None), RuntimeError("boom"))
    assert resp.headers["X-Request-ID"] == "-"


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


# ── IntegrityError 的四条翻译 ─────────────────────────────────────────────────
# 这条路是 README 承诺的"唯一键冲突返回 409"真正的兜底: check_unique 是"先查再写",
# 并发下查与写之间有窗口, 撞上的是这里。以前一条用例都没有。


def _integrity_error(raw: str) -> IntegrityError:
    """仿 DBAPI 的原始错误: 处理器只读 orig.args[0] 里的文本。"""
    return IntegrityError("INSERT INTO xg_tool ...", {}, Exception(raw))


@pytest.mark.parametrize(
    ("raw", "expected_status", "expected_detail"),
    [
        ("Column 'name' cannot be null", 422, "Missing required field"),
        ("Duplicate entry 'deepseek' for key 'uk_tool_slug'", 409, "Resource conflict — unique constraint violated"),
        (
            "Cannot delete or update a parent row: a foreign key constraint fails",
            409,
            "Resource has existing associations, cannot delete",
        ),
        ("some unmapped integrity failure", 409, "Resource conflict"),
    ],
)
async def test_integrity_error_translation(raw: str, expected_status: int, expected_detail: str):
    resp = await integrity_error_handler(_request(), _integrity_error(raw))
    assert resp.status_code == expected_status
    assert json.loads(bytes(resp.body))["detail"] == expected_detail
    assert resp.headers["X-Request-ID"] == "deadbeef"


async def test_integrity_error_does_not_leak_sql():
    """原始 SQL / 索引名只进日志, 不回给调用方(会泄露表名与数据)。"""
    resp = await integrity_error_handler(_request(), _integrity_error("Duplicate entry 'secret' for key 'uk_x'"))
    body = bytes(resp.body).decode()
    assert "secret" not in body
    assert "uk_x" not in body


# ── X-Request-ID 清洗 ─────────────────────────────────────────────────────────
# 客户端带来的值会【回写响应头】并进日志, 所以只接受一个窄字符集。


def _request_with_header(value: str) -> Request:
    return Request(
        {
            "type": "http",
            "method": "GET",
            "path": "/x",
            "headers": [(b"x-request-id", value.encode("utf-8"))],
            "query_string": b"",
            "state": {},
        }
    )


def test_request_id_passes_through_valid_value():
    assert _request_id_of(_request_with_header("abc-123.def_456")) == "abc-123.def_456"


@pytest.mark.parametrize(
    "value",
    [
        "",  # 空值
        "a" * 65,  # 超长
        "bad\r\nX-Injected: 1",  # CRLF: 回写响应头会破坏协议, 也会伪造日志行
        "has space",
        "中文-不行",
        "semi;colon",
    ],
)
def test_request_id_replaces_dangerous_values(value: str):
    generated = _request_id_of(_request_with_header(value))
    assert generated != value
    assert len(generated) == 24  # secrets.token_hex(12)
    assert all(c in "0123456789abcdef" for c in generated)
