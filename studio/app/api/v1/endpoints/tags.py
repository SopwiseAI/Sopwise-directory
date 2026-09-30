from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.models import Tag
from app.schemas.models import TagCountResponse, TagCreate, TagResponse, TagUpdate
from app.utils.db import check_unique, drop_none, published_tag_product_counts

router = APIRouter()


async def _product_count(db: AsyncSession, tag_id: int) -> int:
    """该标签下已发布(status=2)产品数, 与分类计数口径一致。"""
    return (await published_tag_product_counts(db, {tag_id})).get(tag_id, 0)


@router.get("", response_model=list[TagResponse])
async def list_tags(
    status_filter: int | None = Query(None, alias="status", ge=0, le=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
) -> list[TagResponse]:
    stmt = select(Tag).order_by(Tag.sort_order.desc(), Tag.id)
    if status_filter is not None:
        stmt = stmt.where(Tag.status == status_filter)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    tags = list(result.scalars().all())

    tag_ids = [t.id for t in tags]
    count_map = await published_tag_product_counts(db, tag_ids)
    for t in tags:
        t.product_count = count_map.get(t.id, 0)
    return tags


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: AsyncSession = Depends(get_db)) -> TagResponse:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    tag.product_count = await _product_count(db, tag_id)
    return tag


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_write)])
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)) -> TagResponse:
    await check_unique(db, Tag, Tag.slug, data.slug, label="Slug")
    await check_unique(db, Tag, Tag.name, data.name, label="Tag name")

    tag = Tag(**data.model_dump())
    db.add(tag)
    await db.flush()
    await db.refresh(tag)
    tag.product_count = 0
    return tag


@router.put("/{tag_id}", response_model=TagResponse, dependencies=[Depends(require_write)])
async def update_tag(tag_id: int, data: TagUpdate, db: AsyncSession = Depends(get_db)) -> TagResponse:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    update_data = drop_none(data.model_dump(exclude_unset=True))
    if "slug" in update_data and update_data["slug"] != tag.slug:
        await check_unique(db, Tag, Tag.slug, update_data["slug"], exclude_id=tag_id, label="Slug")
    if "name" in update_data and update_data["name"] != tag.name:
        await check_unique(db, Tag, Tag.name, update_data["name"], exclude_id=tag_id, label="Tag name")

    for key, value in update_data.items():
        setattr(tag, key, value)

    await db.flush()
    await db.refresh(tag)
    tag.product_count = await _product_count(db, tag_id)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_write)])
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)) -> None:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await db.delete(tag)


@router.get("/{tag_id}/count", response_model=TagCountResponse)
async def tag_product_count(tag_id: int, db: AsyncSession = Depends(get_db)) -> TagCountResponse:
    if not await db.get(Tag, tag_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    count = await _product_count(db, tag_id)
    return TagCountResponse(product_count=count)
