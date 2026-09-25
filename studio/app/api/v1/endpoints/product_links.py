from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.models import Product, ProductLink, ProductTag, Tag
from app.schemas.models import ProductLinkCreate, ProductLinkResponse, ProductLinkUpdate, ProductTagUpdate
from app.utils.url import url_hash

router = APIRouter()


@router.get("/{product_id}/links", response_model=list[ProductLinkResponse])
async def list_product_links(product_id: int, db: AsyncSession = Depends(get_db)) -> list[ProductLink]:
    stmt = (
        select(ProductLink)
        .where(ProductLink.product_id == product_id)
        .order_by(ProductLink.sort_order.desc(), ProductLink.id)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/{product_id}/links",
    response_model=ProductLinkResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write)],
)
async def add_product_link(product_id: int, data: ProductLinkCreate, db: AsyncSession = Depends(get_db)) -> ProductLink:
    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_hash = url_hash(data.url)
    existing = await db.execute(select(ProductLink).where(ProductLink.url_hash == new_hash))
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
                detail="Product already has a primary link",
            )

    link = ProductLink(
        product_id=product_id,
        url=data.url,
        url_hash=new_hash,
        label=data.label,
        is_primary=data.is_primary,
        sort_order=data.sort_order,
    )
    db.add(link)
    await db.flush()
    await db.refresh(link)
    return link


@router.put(
    "/{product_id}/links/{link_id}",
    response_model=ProductLinkResponse,
    dependencies=[Depends(require_write)],
)
async def update_product_link(
    product_id: int, link_id: int, data: ProductLinkUpdate, db: AsyncSession = Depends(get_db)
) -> ProductLink:
    link = await db.get(ProductLink, link_id)
    if not link or link.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")

    update_data = data.model_dump(exclude_unset=True)

    if "url" in update_data and update_data["url"] != link.url:
        new_hash = url_hash(update_data["url"])
        existing = await db.execute(
            select(ProductLink).where(ProductLink.url_hash == new_hash, ProductLink.id != link_id)
        )
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
                detail="Product already has a primary link",
            )

    for key, value in update_data.items():
        if key != "url":
            setattr(link, key, value)

    await db.flush()
    await db.refresh(link)
    return link


@router.delete(
    "/{product_id}/links/{link_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_write)],
)
async def delete_product_link(product_id: int, link_id: int, db: AsyncSession = Depends(get_db)) -> None:
    link = await db.get(ProductLink, link_id)
    if not link or link.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Link not found")
    await db.delete(link)


@router.put(
    "/{product_id}/tags",
    dependencies=[Depends(require_write)],
)
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

    await db.flush()
    return {"product_id": product_id, "tag_ids": data.tag_ids}
