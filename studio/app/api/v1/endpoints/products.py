from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.core.security import require_write
from app.models import VALID_STATUS_TRANSITIONS, Category, Product, ProductLink, ProductStatus, Tag
from app.schemas.models import ProductCreate, ProductResponse, ProductUpdate
from app.utils.db import check_unique
from app.utils.url import url_hash

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
async def list_products(
    response: Response,
    status_filter: int | None = Query(None, alias="status"),
    category_id: int | None = None,
    featured: bool | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
) -> list[Product]:
    base = select(Product)
    if status_filter is not None:
        base = base.where(Product.status == status_filter)
    if category_id is not None:
        base = base.where(Product.category_id == category_id)
    if featured is not None:
        base = base.where(Product.featured == featured)

    count_stmt = select(func.count()).select_from(base.subquery())
    total = (await db.execute(count_stmt)).scalar() or 0

    stmt = base.options(selectinload(Product.links), selectinload(Product.tags))
    stmt = stmt.order_by(Product.sort_order.desc(), Product.published_at.desc())
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)

    result = await db.execute(stmt)
    products = list(result.scalars().all())
    response.headers["X-Total-Count"] = str(total)
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)) -> Product:
    stmt = (
        select(Product).options(selectinload(Product.links), selectinload(Product.tags)).where(Product.id == product_id)
    )
    result = await db.execute(stmt)
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post(
    "", response_model=ProductResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_write)]
)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)) -> Product:
    await check_unique(db, Product, Product.slug, data.slug, label="Slug")
    await check_unique(db, Product, Product.name, data.name, label="Product name")

    product_data = data.model_dump(exclude={"links", "tag_ids"})
    product = Product(**product_data)

    if product.status == ProductStatus.PUBLISHED:
        product.published_at = datetime.now().replace(microsecond=0)

    for link_data in data.links:
        link = ProductLink(
            url=link_data.url,
            url_hash=url_hash(link_data.url),
            label=link_data.label,
            is_primary=link_data.is_primary,
            sort_order=link_data.sort_order,
        )
        product.links.append(link)

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
            product.tags.append(tag)

    if data.category_id is not None:
        category = await db.get(Category, data.category_id)
        if not category:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Category not found",
            )

    db.add(product)
    await db.flush()

    stmt = (
        select(Product).options(selectinload(Product.links), selectinload(Product.tags)).where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.put("/{product_id}", response_model=ProductResponse, dependencies=[Depends(require_write)])
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)) -> Product:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    if "slug" in update_data and update_data["slug"] != product.slug:
        await check_unique(db, Product, Product.slug, update_data["slug"], exclude_id=product_id, label="Slug")
    if "name" in update_data and update_data["name"] != product.name:
        await check_unique(db, Product, Product.name, update_data["name"], exclude_id=product_id, label="Product name")

    old_status = ProductStatus(product.status)
    for key, value in update_data.items():
        setattr(product, key, value)

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

    await db.flush()

    stmt = (
        select(Product).options(selectinload(Product.links), selectinload(Product.tags)).where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_write)])
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)) -> None:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await db.delete(product)
