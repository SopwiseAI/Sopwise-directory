import asyncio
import logging

from fastapi import APIRouter, Response, status
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import get_app_version
from app.core.database import engine
from app.schemas.common import HealthResponse

logger = logging.getLogger(__name__)
router = APIRouter()

# 探活的超时预算。不能按"SELECT 1 应该很快"来定: 进程起来后的【第一次】建连要把
# SQLAlchemy 的方言探测跑完(版本 / sql_mode / 标识符大小写 / 排序规则 ... 一串【串行】
# 往返), 每一次都等一个 RTT。本机到 SIT 库 RTT ≈0.4s 时实测冷启动首次
# engine.connect() + SELECT 1 = 6.1s, 池子热了之后才 1.4s —— 5s 的预算必然把完全
# 健康的库报成 degraded; 而且超时会取消掉那次建连(方言探测白跑), 只要这段时间只有
# 探活请求打进来, 每次重试都要重走冷路径, 于是永远自愈不了(实测连续 11 次 503)。
#
# 这个预算同时是"库连不上"时的【唯一】上界: aiomysql 的 connect_timeout 默认是 None
# (不像 pymysql 编译进来的 10s), asyncio.wait_for(timeout=None) 等于不设限, TCP 黑洞
# 时底下的建连会一直挂着。实测把 DB_HOST 指向不可路由地址, 探活正好在这个预算上收敛
# 并回 503。取值是折中: 要盖住冷启动那 6s, 又不能让请求挂太久。
_HEALTH_TIMEOUT_SECONDS = 15


@router.get(
    "/health",
    response_model=HealthResponse,
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": HealthResponse}},
)
async def health_check(response: Response) -> HealthResponse:
    """探活: 200 表示库可用, 503 表示库不可用。

    探活必须如实反映"能不能干活", 所以:
      - 用 engine.connect() 直连而不是走请求 session: 只是发一条 SELECT 1, 不该
        为它开一个事务或受 session 生命周期影响
      - 捕获 SQLAlchemyError(DBAPIError 只是它的子类)而不是只捕 DBAPIError ——
        连接池取连接超时抛的是 sqlalchemy.exc.TimeoutError, 它不属于 DBAPIError,
        漏掉就会把"库连不上"报成 500, 让监控以为是代码 bug
      - TimeoutError 在 3.11+ 是 OSError 的子类, 用 asyncio.timeout 兜住卡死的连接;
        但它必须【单独】一支处理, 见下面的注释
    """
    try:
        async with asyncio.timeout(_HEALTH_TIMEOUT_SECONDS):
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="connected", brand="XiGee", version=get_app_version())
    except TimeoutError:
        # 单独一支而不是让它落进下面的 OSError: asyncio.timeout 抛的是【无参】
        # TimeoutError, str(exc) == "" —— 用 "%s" 打出来就是一行
        # "Health check failed: ", 恰好把最该知道的那件事(是探活预算到点了)丢掉。
        # 实测就是这么混淆的: 库明明是好的, 日志里只有一条没有原因的 WARNING。
        logger.warning("Health check timed out after %ss", _HEALTH_TIMEOUT_SECONDS)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="disconnected", brand="XiGee", version=get_app_version())
    except (SQLAlchemyError, OSError) as exc:
        # 只记原因, 不回给调用方: 探测接口的响应体应该是稳定的结构化字段
        logger.warning("Health check failed: %s", exc)
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="disconnected", brand="XiGee", version=get_app_version())
