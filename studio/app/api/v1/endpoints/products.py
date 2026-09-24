from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.models import Category, Product, ProductLink, ProductTag, Tag
from app.schemas.models import (
    ProductCreate,
    ProductLinkCreate,
    ProductLinkResponse,
    ProductLinkUpdate,
    ProductResponse,
    ProductTagUpdate,
    ProductUpdate,
)
from app.utils.url import url_hash

router = APIRouter()

VALID_STATUS_TRANSITIONS: dict[int, set[int]] = {
    0: {1},
    1: {0, 2},
    2: {3},
    3: {2},
}


@router.get("", response_model=list[ProductResponse])
@router.get("/", response_model=list[ProductResponse])
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


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db)) -> Product:
    existing = await db.execute(select(Product).where(Product.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    existing_name = await db.execute(select(Product).where(Product.name == data.name))
    if existing_name.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product name already exists")

    product_data = data.model_dump(exclude={"links", "tag_ids"})
    product = Product(**product_data)

    if product.status == 2:
        product.published_at = datetime.now()

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
    await db.commit()
    await db.refresh(product)

    stmt = (
        select(Product).options(selectinload(Product.links), selectinload(Product.tags)).where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(product_id: int, data: ProductUpdate, db: AsyncSession = Depends(get_db)) -> Product:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    if "slug" in update_data and update_data["slug"] != product.slug:
        existing = await db.execute(select(Product).where(Product.slug == update_data["slug"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    if "name" in update_data and update_data["name"] != product.name:
        existing = await db.execute(select(Product).where(Product.name == update_data["name"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Product name already exists")

    old_status = product.status
    for key, value in update_data.items():
        setattr(product, key, value)

    if "status" in update_data and update_data["status"] != old_status:
        new_status = update_data["status"]
        valid = VALID_STATUS_TRANSITIONS.get(old_status, set())
        if new_status not in valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status transition: {old_status} → {new_status}."
                    f" Valid targets from {old_status}: {sorted(valid) or 'none'}"
                ),
            )

    if update_data.get("status") == 2 and old_status != 2 and not product.published_at:
        product.published_at = datetime.now()

    await db.commit()

    stmt = (
        select(Product).options(selectinload(Product.links), selectinload(Product.tags)).where(Product.id == product.id)
    )
    result = await db.execute(stmt)
    return result.scalar_one()


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)) -> None:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await db.delete(product)
    await db.commit()


@router.get("/{product_id}/links", response_model=list[ProductLinkResponse])
async def list_product_links(product_id: int, db: AsyncSession = Depends(get_db)) -> list[ProductLink]:
    stmt = (
        select(ProductLink)
        .where(ProductLink.product_id == product_id)
        .order_by(ProductLink.sort_order.desc(), ProductLink.id)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/{product_id}/links", response_model=ProductLinkResponse, status_code=status.HTTP_201_CREATED)
async def add_product_link(product_id: int, data: ProductLinkCreate, db: AsyncSession = Depends(get_db)) -> ProductLink:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    link_hash = url_hash(data.url)
    existing = await db.execute(select(ProductLink).where(ProductLink.url_hash == link_hash))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="URL already exists")

    if data.is_primary:
        existing_primary = await db.execute(
            select(ProductLink).where(
                ProductLink.product_id == product_id,
                ProductLink.is_primary == True,  # noqa: E712
            )
        )
        if existing_primary.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product already has a primary link. Update the existing one first.",
            )

    link = ProductLink(
        product_id=product_id,
        url=data.url,
        url_hash=link_hash,
        label=data.label,
        is_primary=data.is_primary,
        sort_order=data.sort_order,
    )
    db.add(link)
    await db.commit()
    await db.refresh(link)
    return link


@router.put("/{product_id}/links/{link_id}", response_model=ProductLinkResponse)
async def update_product_link(
    product_id: int, link_id: int, data: ProductLinkUpdate, db: AsyncSession = Depends(get_db)
) -> ProductLink:
    link = await db.get(ProductLink, link_id)
    if not link or link.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    update_data = data.model_dump(exclude_unset=True)

    if "url" in update_data and update_data["url"] != link.url:
        new_hash = url_hash(update_data["url"])
        existing = await db.execute(select(ProductLink).where(ProductLink.url_hash == new_hash))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="URL already exists")
        link.url = update_data["url"]
        link.url_hash = new_hash

    if update_data.get("is_primary") is True and not link.is_primary:
        existing_primary = await db.execute(
            select(ProductLink).where(
                ProductLink.product_id == product_id,
                ProductLink.is_primary == True,  # noqa: E712
                ProductLink.id != link_id,
            )
        )
        if existing_primary.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Product already has a primary link.",
            )

    for key, value in update_data.items():
        if key != "url":
            setattr(link, key, value)

    await db.commit()
    await db.refresh(link)
    return link


@router.delete("/{product_id}/links/{link_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product_link(product_id: int, link_id: int, db: AsyncSession = Depends(get_db)) -> None:
    link = await db.get(ProductLink, link_id)
    if not link or link.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    await db.delete(link)
    await db.commit()


@router.put("/{product_id}/tags")
async def update_product_tags(product_id: int, data: ProductTagUpdate, db: AsyncSession = Depends(get_db)) -> dict:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    tag_result = await db.execute(select(Tag).where(Tag.id.in_(data.tag_ids)))
    valid_tags = {t.id for t in tag_result.scalars().all()}
    invalid_ids = set(data.tag_ids) - valid_tags
    if invalid_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Tag IDs not found: {list(invalid_ids)}",
        )

    await db.execute(ProductTag.__table__.delete().where(ProductTag.product_id == product_id))
    for tag_id in data.tag_ids:
        db.add(ProductTag(product_id=product_id, tag_id=tag_id))

    await db.commit()
    return {"product_id": product_id, "tag_ids": data.tag_ids}
