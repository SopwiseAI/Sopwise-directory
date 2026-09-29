import asyncio
import json
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import Category, CategoryStatus, LinkStatus, Product, ProductStatus, TagStatus

logger = logging.getLogger(__name__)

DEFAULT_CATEGORY_ICON = "Box"


async def export_to_json(session: AsyncSession) -> dict:
    settings = get_settings()

    categories = await _fetch_categories(session)
    products = await _fetch_products(session)

    data = {
        "categories": categories,
        "products": products,
    }

    output_path = settings.export_full_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    content = json.dumps(data, ensure_ascii=False, indent=2)
    await asyncio.to_thread(output_path.write_text, content, "utf-8")

    synced_frontend = False
    if settings.app_env == "prod":
        source_path = output_path.parent / "data.json"
        await asyncio.to_thread(source_path.write_text, content, "utf-8")
        synced_frontend = True
        logger.info("Synced frontend data source → %s", source_path)
    else:
        logger.info("env=%s, skipped data.json sync (env artifact only)", settings.app_env)

    logger.info("Exported %d categories, %d products → %s", len(categories), len(products), output_path)

    return {
        "exported_at": datetime.now().isoformat(),
        "output_path": str(output_path),
        "categories_count": len(categories),
        "products_count": len(products),
        "app_env": settings.app_env,
        "synced_frontend": synced_frontend,
    }


async def _fetch_categories(session: AsyncSession) -> list[dict]:
    stmt = (
        select(Category)
        .where(Category.status == CategoryStatus.ACTIVE)
        .order_by(Category.sort_order.desc(), Category.id)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "id": row.slug,
            "name": row.name,
            "icon": row.icon or DEFAULT_CATEGORY_ICON,
        }
        for row in rows
    ]


async def _fetch_products(session: AsyncSession) -> list[dict]:
    stmt = (
        select(Product)
        .options(
            selectinload(Product.links),
            selectinload(Product.tags),
            selectinload(Product.categories),
        )
        .where(Product.status == ProductStatus.PUBLISHED)
        .order_by(Product.sort_order.desc(), Product.published_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    products = []
    for row in rows:
        active_links = [lnk for lnk in row.links if lnk.status == LinkStatus.ACTIVE]
        primary = next((lnk for lnk in active_links if lnk.is_primary), None)
        lnk = primary or (active_links[0] if active_links else None)

        # 无 active 链接的产品跳过导出; 前端 url 必填, 避免死链
        if not lnk:
            continue

        item = {
            "id": row.slug,
            "name": row.name,
            "description": row.description or "",
            "url": lnk.url,
            "categories": [c.slug for c in row.categories],
            "tags": [t.name for t in row.tags if t.status == TagStatus.ACTIVE],
            "pricing": row.pricing,
            "featured": row.featured,
        }

        if row.published_at:
            item["publishedAt"] = row.published_at.strftime("%Y-%m-%d")
        if row.created_at:
            item["createdAt"] = row.created_at.strftime("%Y-%m-%d")

        products.append(item)

    return products
