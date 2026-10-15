"""数据库引擎参数守卫。"""

from app.core.database import _CONNECT_TIMEOUT_SECONDS, _engine_kwargs


def test_engine_sets_connect_timeout():
    """建连必须有超时上界。

    aiomysql 的 connect_timeout 默认是 None(等于不设限): DB 主机被防火墙丢包 / TCP 黑洞时,
    建连会一直挂着 —— 而 pool_timeout 只在"池满"时生效, 救不了它, 请求会永久占住 uvicorn
    worker。只有 /health 自带 asyncio.timeout, 其余端点全靠这个值兜底。
    """
    timeout = _engine_kwargs["connect_args"]["connect_timeout"]
    assert timeout == _CONNECT_TIMEOUT_SECONDS
    assert 1 <= timeout <= 30
