from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models import ProductTag, Tag
from app.schemas.models import TagCreate, TagResponse, TagUpdate

router = APIRouter()


@router.get("", response_model=list[TagResponse])
@router.get("/", response_model=list[TagResponse])
async def list_tags(
    db: AsyncSession = Depends(get_db),
) -> list[Tag]:
    stmt = select(Tag).order_by(Tag.name)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(tag_id: int, db: AsyncSession = Depends(get_db)) -> Tag:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    return tag


@router.post("", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=TagResponse, status_code=status.HTTP_201_CREATED)
async def create_tag(data: TagCreate, db: AsyncSession = Depends(get_db)) -> Tag:
    existing = await db.execute(select(Tag).where(Tag.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    existing_name = await db.execute(select(Tag).where(Tag.name == data.name))
    if existing_name.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag name already exists")

    tag = Tag(**data.model_dump())
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=TagResponse)
async def update_tag(tag_id: int, data: TagUpdate, db: AsyncSession = Depends(get_db)) -> Tag:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")

    update_data = data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != tag.slug:
        existing = await db.execute(select(Tag).where(Tag.slug == update_data["slug"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    if "name" in update_data and update_data["name"] != tag.name:
        existing = await db.execute(select(Tag).where(Tag.name == update_data["name"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Tag name already exists")

    for key, value in update_data.items():
        setattr(tag, key, value)

    await db.commit()
    await db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tag(tag_id: int, db: AsyncSession = Depends(get_db)) -> None:
    tag = await db.get(Tag, tag_id)
    if not tag:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tag not found")
    await db.delete(tag)
    await db.commit()


@router.get("/{tag_id}/count")
async def tag_product_count(tag_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    stmt = select(func.count()).select_from(ProductTag).where(ProductTag.tag_id == tag_id)
    count = (await db.execute(stmt)).scalar() or 0
    return {"tag_id": tag_id, "product_count": count}
