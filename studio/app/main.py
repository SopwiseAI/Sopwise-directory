import logging
import re
import secrets
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError, OperationalError
from sqlalchemy.exc import TimeoutError as SATimeoutError

from app.api.v1.router import router as v1_router
from app.core.config import get_app_version, get_settings
from app.core.database import engine
from app.core.logging import configure_logging
from app.utils.url import InvalidURLError

logger = logging.getLogger(__name__)

# 日志/性能都要求请求 id 是短且可打印的, 具体格式不限
_REQUEST_ID_PATTERN = re.compile(r"[A-Za-z0-9._-]{1,64}")


def _generate_request_id() -> str:
    return secrets.token_hex(12)


def _request_id_of(request: Request) -> str:
    """取客户端带来的 X-Request-ID, 不合法就换一个新的。

    这个值既回写响应头又进日志, 原样反射等于把请求头当成了可信输入:
    带 CR/LF 的值会破坏响应头(h11 直接报错断连), 也能伪造日志行。
    所以只接受一个窄字符集, 其余一律换成自己生成的值。
    """
    candidate = request.headers.get("X-Request-ID", "")
    return candidate if _REQUEST_ID_PATTERN.fullmatch(candidate) else _generate_request_id()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    settings = get_settings()
    # 日志在这里配置, 不在模块导入时: import app.main 不该产生全局副作用
    configure_logging(settings)
    logger.info(
        "Studio starting [%s] | DB: %s:%s/%s",
        settings.app_env,
        settings.db_host,
        settings.db_port,
        settings.db_name,
    )
    yield
    logger.info("Studio shutting down...")
    await engine.dispose()
    logger.info("DB engine disposed")


_settings = get_settings()

app = FastAPI(
    title="XiGee Studio API",
    description="XiGee Studio — 数据管理后端",
    version=get_app_version(),
    debug=_settings.app_debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Request-ID"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = _request_id_of(request)
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(InvalidURLError)
async def invalid_url_handler(request: Request, exc: InvalidURLError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
        headers={"X-Request-ID": getattr(request.state, "request_id", "-")},
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = []
    for err in exc.errors():
        loc = ".".join(str(p) for p in err.get("loc", []))
        errors.append(f"{loc}: {err.get('msg', '')}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content={"detail": "; ".join(errors)},
        headers={"X-Request-ID": getattr(request.state, "request_id", "-")},
    )


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "-")
    logger.warning(
        "Integrity error [%s] on %s %s: %s",
        request_id,
        request.method,
        request.url.path,
        exc,
    )
    # 只翻译成少数几种可操作的说法, 原始 SQL / 字段值全部留在日志里:
    # 直接把 str(exc.orig) 回给调用方会泄露表名、索引名甚至数据本身
    raw = str(exc.orig.args[0]) if exc.orig and exc.orig.args else ""
    status_code = status.HTTP_409_CONFLICT
    detail = "Resource conflict"
    if "cannot be null" in raw:
        # MySQL 1048: 说明端点漏了必填校验, 这是请求内容的问题, 不是资源状态冲突
        status_code = status.HTTP_422_UNPROCESSABLE_CONTENT
        detail = "Missing required field"
    elif "Duplicate entry" in raw or "UNIQUE" in raw:
        detail = "Resource conflict — unique constraint violated"
    elif "FOREIGN KEY" in raw or "cannot delete" in raw.lower():
        detail = "Resource has existing associations, cannot delete"
    return JSONResponse(
        status_code=status_code,
        content={"detail": detail},
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(OperationalError)
@app.exception_handler(SATimeoutError)
async def database_unavailable_handler(request: Request, exc: OperationalError | SATimeoutError) -> JSONResponse:
    """库连不上 / 锁等待超时 / 连接池取不到连接 => 503, 不是 500。

    "服务器自己写错了"和"依赖暂时不可用"要能区分开: 前者报警给人看, 后者应该
    重试。把 OperationalError 归到 500 会让监控把每次数据库抖动都当成代码回归。
    """
    request_id = getattr(request.state, "request_id", "-")
    logger.error(
        "Database unavailable [%s] on %s %s: %s",
        request_id,
        request.method,
        request.url.path,
        exc,
    )
    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content={"detail": "Database unavailable, please retry"},
        headers={"X-Request-ID": request_id},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "-")
    logger.error(
        "Unhandled exception [%s] on %s %s: %s",
        request_id,
        request.method,
        request.url.path,
        exc,
        # 传异常实例而不是 True: True 取的是 sys.exc_info(), 而这个处理器是被 Starlette
        # 在自己的 except 块里 await 的, 能拿到调用栈纯属实现细节。传实例在哪都能打印
        # 完整 traceback(ruff 的 LOG014 指的也是这条)。
        exc_info=exc,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"X-Request-ID": request_id},
    )


app.include_router(v1_router, prefix="/api/v1")
