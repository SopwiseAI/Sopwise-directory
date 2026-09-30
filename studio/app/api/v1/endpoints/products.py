from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.core.security import require_write
from app.models import (
    VALID_STATUS_TRANSITIONS,
    Category,
    Product,
    ProductCategory,
    ProductLink,
    ProductRelation,
    ProductStatus,
    ProductTag,
    Tag,
)
from app.schemas.models import ProductCreate, ProductResponse, ProductUpdate
from app.utils.db import check_unique, drop_none, published_category_counts, published_tag_product_counts
from app.utils.url import url_hash

router = APIRouter()


async def _fill_nested_counts(db: AsyncSession, products: list[Product]) -> None:
    """为产品响应中嵌套的分类/标签填充 product_count, 避免返回恒为 0 的误导值."""
    category_ids = {c.id for p in products for c in p.categories}
    tag_ids = {t.id for p in products for t in p.tags}
    cat_counts = await published_category_counts(db, category_ids)
    tag_counts = await published_tag_product_counts(db, tag_ids)
    for product in products:
        for category in product.categories:
            category.product_count = cat_counts.get(category.id, 0)
        for tag in product.tags:
            tag.product_count = tag_counts.get(tag.id, 0)


@router.get("", response_model=list[ProductResponse])
async def list_products(
    response: Response,
    status_filter: int | None = Query(None, alias="status"),
    category_id: int | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[ProductResponse]:
    base = select(Product)
    if status_filter is not None:
        base = base.where(Product.status == status_filter)
    if category_id is not None:
        base = base.join(ProductCategory, ProductCategory.product_id == Product.id).where(
            ProductCategory.category_id == category_id
        )
    if featured is not None:
        base = base.where(Product.featured == featured)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = base.options(
        selectinload(Product.links),
        selectinload(Product.tags),
        selectinload(Product.categories),
        selectinload(Product.relateds).selectinload(ProductRelation.related_product),
    )
    stmt = stmt.order_by(Product.sort_order.desc(), Product.published_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    products = list(result.scalars().all())
    await _fill_nested_counts(db, products)
    response.headers["X-Total-Count"] = str(total)
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> ProductResponse:
    stmt = (
        select(Product)
        .options(
            selectinload(Product.links),
            selectinload(Product.tags),
            selectinload(Product.categories),
            selectinload(Product.relateds).selectinload(ProductRelation.related_product),
        )
        .where(Product.id == product_id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await _fill_nested_counts(db, [product])
    return product


_VALID_INITIAL_STATUSES = {ProductStatus.DRAFT, ProductStatus.PENDING}


@router.post(
    "", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_write)]
)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)) -> ProductResponse:
    await check_unique(db, Product, Product.slug, data.slug, label="Slug")
    await check_unique(db, Product, Product.name, data.name, label="Product name")

    initial_status = ProductStatus(data.status)
    if initial_status not in _VALID_INITIAL_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Initial status must be DRAFT(0) or PENDING(1), got {initial_status}",
        )

    product_data = data.model_dump(exclude={"links", "tag_ids", "category_ids"})
    product = Product(**product_data)

    if sum(1 for link in data.links if link.is_primary) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only one primary link allowed per product",
        )

    db.add(product)
    await db.flush()

    for link_data in data.links:
        link = ProductLink(
            product_id=product.id,
            url=link_data.url,
            url_hash=url_hash(link_data.url),
            label=link_data.label,
            is_primary=link_data.is_primary,
            status=link_data.status,
            sort_order=link_data.sort_order,
        )
        db.add(link)

    if data.tag_ids:
        tag_result = await db.execute(select(Tag).where(Tag.id.in_(data.tag_ids)))
        tags = tag_result.scalars().all()
        valid_tags = {t.id for t in tags}
        invalid_ids = set(data.tag_ids) - valid_tags
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag IDs not found: {list(invalid_ids)}",
            )
        for tag in tags:
            db.add(ProductTag(product_id=product.id, tag_id=tag.id))

    if data.category_ids:
        cat_result = await db.execute(select(Category).where(Category.id.in_(data.category_ids)))
        categories = cat_result.scalars().all()
        valid_cats = {c.id for c in categories}
        invalid_ids = set(data.category_ids) - valid_cats
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category IDs not found: {list(invalid_ids)}",
            )
        for cat in categories:
            db.add(ProductCategory(product_id=product.id, category_id=cat.id))

    await db.flush()

    stmt = (
        select(Product)
        .options(
            selectinload(Product.links),
            selectinload(Product.tags),
            selectinload(Product.categories),
            selectinload(Product.relateds).selectinload(ProductRelation.related_product),
        )
        .where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one()
    await _fill_nested_counts(db, [product])
    return product


@router.put("/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_write)])
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)) -> ProductResponse:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = drop_none(data.model_dump(exclude_unset=True), keep_none=("description",))

    if "slug" in update_data and update_data["slug"] != product.slug:
        await check_unique(db, Product, Product.slug, update_data["slug"], exclude_id=product_id, label="Slug")
    if "name" in update_data and update_data["name"] != product.name:
        await check_unique(db, Product, Product.name, update_data["name"], exclude_id=product_id, label="Product name")

    old_status = ProductStatus(product.status)

    if "status" in update_data:
        new_status = ProductStatus(update_data["status"])
        if new_status != old_status:
            valid = VALID_STATUS_TRANSITIONS.get(old_status, set())
            if new_status not in valid:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Invalid status transition: {old_status} → {new_status}."
                        f" Valid targets: {sorted(valid) or 'none'}"
                    ),
                )
        if new_status == ProductStatus.PUBLISHED and old_status != ProductStatus.PUBLISHED and not product.published_at:
            product.published_at = datetime.now().replace(microsecond=0)

    for key, value in update_data.items():
        if key not in ("category_ids", "tag_ids"):
            setattr(product, key, value)

    if "category_ids" in update_data:
        new_ids = set(update_data["category_ids"])
        cat_result = await db.execute(select(Category).where(Category.id.in_(new_ids)))
        categories = cat_result.scalars().all()
        valid_cats = {c.id for c in categories}
        invalid_ids = new_ids - valid_cats
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Category IDs not found: {list(invalid_ids)}",
            )
        existing_stmt = select(ProductCategory).where(ProductCategory.product_id == product_id)
        existing = (await db.execute(existing_stmt)).scalars().all()
        existing_ids = {pc.category_id for pc in existing}
        for pc in existing:
            if pc.category_id not in new_ids:
                await db.delete(pc)
        for cat_id in new_ids - existing_ids:
            db.add(ProductCategory(product_id=product_id, category_id=cat_id))

    if "tag_ids" in update_data:
        new_tag_ids = set(update_data["tag_ids"])
        tag_result = await db.execute(select(Tag).where(Tag.id.in_(new_tag_ids)))
        tags = tag_result.scalars().all()
        valid_tags = {t.id for t in tags}
        invalid_ids = new_tag_ids - valid_tags
        if invalid_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Tag IDs not found: {list(invalid_ids)}",
            )
        await db.execute(ProductTag.__table__.delete().where(ProductTag.product_id == product_id))
        for tag_id in new_tag_ids:
            db.add(ProductTag(product_id=product_id, tag_id=tag_id))

    await db.flush()

    stmt = (
        select(Product)
        .options(
            selectinload(Product.links),
            selectinload(Product.tags),
            selectinload(Product.categories),
            selectinload(Product.relateds).selectinload(ProductRelation.related_product),
        )
        .where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one()
    await _fill_nested_counts(db, [product])
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_write)])
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)) -> None:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await db.delete(product)
