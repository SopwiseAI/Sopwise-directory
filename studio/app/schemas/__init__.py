"""请求/响应 Schema 包。

刻意【不做】re-export barrel: 各处直接 `from app.schemas.models import ...` /
`from app.schemas.common import ...`。以前这里有一份 33 行的清单(加 __all__),
但全仓没有任何消费者 —— 每加一个 schema 就要在两处补名, 是纯维护成本。
"""
