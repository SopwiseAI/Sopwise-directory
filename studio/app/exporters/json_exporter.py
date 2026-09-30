import asyncio
import json
import logging
import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.models import PRICINGS, Category, CategoryStatus, LinkStatus, Product, ProductStatus, TagStatus

logger = logging.getLogger(__name__)

DEFAULT_CATEGORY_ICON = "Box"
UNCATEGORIZED_SLUG = "misc"
UNCATEGORIZED_NAME = "未分类"
_VALID_PRICINGS = frozenset(PRICINGS)


def _blank(value: str | None) -> bool:
    return value is None or not value.strip()


def _write_text_atomic(path: Path, content: str) -> None:
    """原子写入: 先写同目录临时文件再 os.replace, 避免中途失败留下被截断的 JSON。"""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.tmp")
    try:
        tmp.write_text(content, encoding="utf-8")
        os.replace(tmp, path)
    finally:
        tmp.unlink(missing_ok=True)


def _invalid_reason(row: Product, url: str) -> str | None:
    """校验前端 SiteData 契约的必填字段, 返回问题描述(合法则为 None)。"""
    if _blank(row.slug) or _blank(row.name):
        return "slug/name 为空"
    if _blank(url):
        return "url 为空"
    if row.pricing not in _VALID_PRICINGS:
        return f"pricing 非法: {row.pricing!r}"
    return None


async def export_to_json(session: AsyncSession) -> dict:
    settings = get_settings()

    categories = await _fetch_categories(session)
    products = await _fetch_products(session)
    _ensure_uncategorized(categories, products)

    data = {
        "categories": categories,
        "products": products,
    }

    output_path = settings.export_full_path
    content = json.dumps(data, ensure_ascii=False, indent=2)
    await asyncio.to_thread(_write_text_atomic, output_path, content)

    synced_frontend = False
    if settings.app_env == "prod":
        source_path = output_path.parent / "data.json"
        await asyncio.to_thread(_write_text_atomic, source_path, content)
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


def _ensure_uncategorized(categories: list[dict], products: list[dict]) -> None:
    """若存在无有效分类的产品, 保证分类列表中含合成的未分类项(复用同名真实分类)。"""
    referenced = any(UNCATEGORIZED_SLUG in p["categories"] for p in products)
    exists = any(c["id"] == UNCATEGORIZED_SLUG for c in categories)
    if referenced and not exists:
        categories.append({"id": UNCATEGORIZED_SLUG, "name": UNCATEGORIZED_NAME, "icon": DEFAULT_CATEGORY_ICON})


async def _fetch_categories(session: AsyncSession) -> list[dict]:
    stmt = (
        select(Category)
        .where(Category.status == CategoryStatus.ACTIVE)
        .order_by(Category.sort_order.desc(), Category.id)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    categories = []
    for row in rows:
        if _blank(row.slug) or _blank(row.name):
            logger.warning("跳过分类 id=%s: slug/name 为空", row.id)
            continue
        categories.append({"id": row.slug, "name": row.name, "icon": row.icon or DEFAULT_CATEGORY_ICON})
    return categories


async def _fetch_products(session: AsyncSession) -> list[dict]:
    stmt = (
        select(Product)
        .options(
            selectinload(Product.links),
            selectinload(Product.tags),
            selectinload(Product.categories),
        )
        .where(Product.status == ProductStatus.PUBLISHED)
        .order_by(Product.sort_order.desc(), Product.published_at.desc(), Product.id)
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    products = []
    for row in rows:
        active_links = sorted(
            (lnk for lnk in row.links if lnk.status == LinkStatus.ACTIVE),
            key=lambda lnk: (-lnk.sort_order, lnk.id),
        )
        primary = next((lnk for lnk in active_links if lnk.is_primary), None)
        lnk = primary or (active_links[0] if active_links else None)

        # 无 active 链接的产品跳过导出; 前端 url 必填, 避免死链
        if not lnk:
            continue

        if reason := _invalid_reason(row, lnk.url):
            logger.warning("跳过产品 id=%s: %s", row.id, reason)
            continue

        item = {
            "id": row.slug,
            "name": row.name,
            "description": row.description or "",
            "url": lnk.url,
            "categories": [
                c.slug
                for c in sorted(row.categories, key=lambda c: (-c.sort_order, c.id))
                if c.status == CategoryStatus.ACTIVE
            ]
            or [UNCATEGORIZED_SLUG],
            "tags": [
                t.name for t in sorted(row.tags, key=lambda t: (-t.sort_order, t.id)) if t.status == TagStatus.ACTIVE
            ],
            "pricing": row.pricing,
            "featured": row.featured,
        }

        if row.published_at:
            item["publishedAt"] = row.published_at.strftime("%Y-%m-%d")
        if row.created_at:
            item["createdAt"] = row.created_at.strftime("%Y-%m-%d")

        products.append(item)

    return products
