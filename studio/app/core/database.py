import os
import sys
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

# 测试下必须换成 NullPool: pytest-asyncio 每个用例一个事件循环, 池子会把上一轮循环里
# 建的连接带进下一轮, 报 "attached to a different loop"。用 sys.modules 判断是为了让
# conftest 在 import 阶段就生效(那时 PYTEST_CURRENT_TEST 还没设上)。
_is_test = bool(os.getenv("PYTEST_CURRENT_TEST")) or "pytest" in sys.modules

settings = get_settings()

# 建连超时(秒)。aiomysql 的 connect_timeout 默认是 None, 等于不设限: DB 主机被防火墙丢包 /
# TCP 黑洞时, 建连会一直挂着 —— 而 pool_timeout 只在"池满"时生效, 救不了它, 请求会永久占住
# uvicorn worker。/health 自带 asyncio.timeout(理由见 endpoints/health.py), 其余端点靠这里。
_CONNECT_TIMEOUT_SECONDS = 10

_engine_kwargs: dict[str, Any] = {
    "echo": settings.db_echo,
    "connect_args": {"connect_timeout": _CONNECT_TIMEOUT_SECONDS},
    # 双保险: 服务端 wait_timeout 掐掉的连接靠 pre_ping 剔除, pool_recycle 提前换掉
    # 闲置连接, 免得把一个已经死掉的连接借给请求
    "pool_pre_ping": True,
    "pool_recycle": 3600,
}

if _is_test:
    _engine_kwargs["poolclass"] = NullPool
else:
    _engine_kwargs["pool_size"] = settings.db_pool_size
    _engine_kwargs["max_overflow"] = settings.db_max_overflow

engine = create_async_engine(settings.database_url, **_engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    # commit 后还要能读属性(响应要序列化 ORM 对象)。expire_on_commit=True 会让那次读取
    # 触发隐式 IO, 在异步 session 里直接抛 MissingGreenlet
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass
