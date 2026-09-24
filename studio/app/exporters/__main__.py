import asyncio
import logging
import sys

from app.core.database import AsyncSessionLocal, engine
from app.exporters.json_exporter import export_to_json

logging.basicConfig(level=logging.INFO, format="%(levelname)s:     %(name)s - %(message)s")
logger = logging.getLogger(__name__)


async def main() -> int:
    logger.info("Starting JSON export...")
    try:
        async with AsyncSessionLocal() as session:
            result = await export_to_json(session)
        logger.info(
            "Export complete: %d categories, %d products → %s",
            result["categories_count"],
            result["products_count"],
            result["output_path"],
        )
        return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
