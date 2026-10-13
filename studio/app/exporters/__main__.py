"""JSON 导出器命令行入口: python -m app.exporters。

退出码: 0=导出成功; 1=导出失败(连不上库 / 读到枚举外的值 / 写文件失败)。
失败时保留完整堆栈 —— 导出器在发布链路末端, 静默失败会让前端一直吃旧数据。
"""

import asyncio
import logging
import sys

from app.core.config import get_settings
from app.core.database import AsyncSessionLocal, engine
from app.core.logging import configure_logging
from app.exporters.json_exporter import export_to_json

logger = logging.getLogger(__name__)


async def main() -> int:
    # 与 app.main 的 lifespan 一致: 日志在启动路径上配置, 不在模块导入时
    configure_logging(get_settings())
    logger.info("Starting JSON export...")
    try:
        async with AsyncSessionLocal() as session:
            result = await export_to_json(session)
        logger.info(
            "Export complete: %d topics, %d tools → %s",
            result.topics_count,
            result.tools_count,
            result.output_path,
        )
        return 0
    except Exception:
        # 不让异常裸奔到解释器: 退出码要明确是 1(而不是靠解释器默认值), 堆栈仍留给日志
        logger.exception("Export failed")
        return 1
    finally:
        # 成功与失败都要放掉连接池, 否则 aiomysql 的连接会挂到进程退出
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
