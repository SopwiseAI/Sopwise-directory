"""日志初始化。

刻意【不在模块导入时】调 logging.basicConfig: 那会让 `import app.main` 产生全局副作用
-- 测试、导出器、任何 import 它的工具链都会被动改掉 root logger, 而日志级别还写死在
代码里, 运维没有旋钮。改成由两条启动路径各显式调一次:

    app.main 的 lifespan        (服务)
    app.exporters.__main__.main (导出器)

不用 force=True: pytest 已经给 root 挂了 handler, force 会把它们拆掉。basicConfig 在
root 已有 handler 时本来就是 no-op, 这正是我们要的"不跟宿主抢日志"。
"""

import logging

from app.core.config import Settings


def configure_logging(settings: Settings) -> None:
    logging.basicConfig(
        level=settings.log_level,
        format="%(levelname)s: %(name)s - %(message)s",
    )
