from collections.abc import Collection, Iterable

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import DeclarativeBase, InstrumentedAttribute

from app.models import Product, ProductCategory, ProductStatus, ProductTag


def drop_none(data: dict, *, keep_none: Collection[str] = ()) -> dict:
    """移除显式 None 值。

    `model_dump(exclude_unset=True)` 仍会保留显式传入的 null; 对非空字段
    (NOT NULL / 枚举) 这类值会导致 500 或语义错误的 409。`keep_none` 中的
    字段保留 None, 用于"清空可空字段"。
    """
    keep = set(keep_none)
    return {key: value for key, value in data.items() if value is not None or key in keep}


async def check_unique(
    db: AsyncSession,
    model: type[DeclarativeBase],
    field: InstrumentedAttribute[str],
    value: str,
    *,
    exclude_id: int | None = None,
    label: str = "Field",
) -> None:
    """Check that a field value is unique, raising 409 if it exists.

    Args:
        model: SQLAlchemy model class
        field: Column to check
        value: Value to check for
        exclude_id: If set, ignores the row with this id (for updates)
        label: Human-readable field name for error message
    """
    stmt = select(model.id).where(field == value)
    if exclude_id is not None:
        stmt = stmt.where(model.id != exclude_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{label} already exists",
        )


async def published_category_counts(db: AsyncSession, category_ids: Iterable[int]) -> dict[int, int]:
    """批量统计各分类下已发布(status=2)产品数, 返回 {category_id: count}."""
    ids = set(category_ids)
    if not ids:
        return {}
    stmt = (
        select(ProductCategory.category_id, func.count().label("cnt"))
        .join(Product, Product.id == ProductCategory.product_id)
        .where(ProductCategory.category_id.in_(ids), Product.status == ProductStatus.PUBLISHED)
        .group_by(ProductCategory.category_id)
    )
    rows = await db.execute(stmt)
    return {row.category_id: row.cnt for row in rows}


async def published_tag_product_counts(db: AsyncSession, tag_ids: Iterable[int]) -> dict[int, int]:
    """批量统计各标签下已发布(status=2)产品数, 返回 {tag_id: count}."""
    ids = set(tag_ids)
    if not ids:
        return {}
    stmt = (
        select(ProductTag.tag_id, func.count().label("cnt"))
        .join(Product, Product.id == ProductTag.product_id)
        .where(ProductTag.tag_id.in_(ids), Product.status == ProductStatus.PUBLISHED)
        .group_by(ProductTag.tag_id)
    )
    rows = await db.execute(stmt)
    return {row.tag_id: row.cnt for row in rows}
