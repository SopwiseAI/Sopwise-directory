import json
import logging
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import Category, Product

logger = logging.getLogger(__name__)


async def export_to_json(session: AsyncSession) -> dict:
    settings = get_settings()

    cat_map = await _build_category_slug_map(session)
    categories = await _fetch_categories(session)
    products = await _fetch_products(session, cat_map)

    data = {
        "categories": categories,
        "products": products,
    }

    output_path = settings.export_full_path
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    logger.info("Exported %d categories, %d products → %s", len(categories), len(products), output_path)

    return {
        "exported_at": datetime.now().isoformat(),
        "output_path": str(output_path),
        "categories_count": len(categories),
        "products_count": len(products),
    }


async def _build_category_slug_map(session: AsyncSession) -> dict[int, str]:
    stmt = select(Category.id, Category.slug).where(Category.status == 1)
    result = await session.execute(stmt)
    return {row.id: row.slug for row in result.all()}


async def _fetch_categories(session: AsyncSession) -> list[dict]:
    stmt = select(Category).where(Category.status == 1).order_by(Category.sort_order.desc(), Category.id)
    result = await session.execute(stmt)
    rows = result.scalars().all()

    return [
        {
            "id": row.slug,
            "name": row.name,
            "icon": row.icon,
        }
        for row in rows
    ]


async def _fetch_products(session: AsyncSession, cat_map: dict[int, str]) -> list[dict]:
    stmt = (
        select(Product)
        .options(selectinload(Product.links), selectinload(Product.tags))
        .where(Product.status == 2)
        .order_by(Product.sort_order.desc(), Product.published_at.desc())
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    products = []
    for row in rows:
        primary_link = next((lnk for lnk in row.links if lnk.is_primary), None)
        fallback_link = row.links[0] if row.links else None
        link = primary_link or fallback_link

        products.append(
            {
                "id": row.slug,
                "name": row.name,
                "description": row.description or "",
                "url": link.url if link else "",
                "categoryId": cat_map.get(row.category_id, "") if row.category_id else "",
                "tags": [t.name for t in row.tags],
                "pricing": row.pricing,
                "featured": row.featured,
                "publishedAt": row.published_at.strftime("%Y-%m-%d") if row.published_at else "",
            }
        )

    return products
