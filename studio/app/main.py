import logging
import secrets
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.api.v1.router import router as v1_router
from app.core.config import get_app_version, get_settings
from app.core.database import engine
from app.utils.url import InvalidURLError

logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(name)s - %(message)s")
logger = logging.getLogger(__name__)


def _generate_request_id() -> str:
    return secrets.token_hex(12)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
    settings = get_settings()
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
    title="Sopwise Studio API",
    description="Sopwise Directory Studio — 数据管理后端",
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
    request_id = request.headers.get("X-Request-ID") or _generate_request_id()
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
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
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
    detail = "Resource conflict"
    if exc.orig and exc.orig.args:
        err = str(exc.orig.args[0])
        if "Duplicate entry" in err or "UNIQUE" in err:
            detail = "Resource conflict — unique constraint violated"
        elif "FOREIGN KEY" in err or "cannot delete" in err.lower():
            detail = "Resource has existing associations, cannot delete"
    return JSONResponse(
        status_code=409,
        content={"detail": detail},
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
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
        headers={"X-Request-ID": request_id},
    )


app.include_router(v1_router, prefix="/api/v1")
