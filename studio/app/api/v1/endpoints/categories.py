from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.models import Category, Product
from app.schemas.models import (
    CategoryCreate,
    CategoryResponse,
    CategoryUpdate,
)

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
@router.get("/", response_model=list[CategoryResponse])
async def list_categories(
    status_filter: int | None = Query(None, alias="status"),
    db: AsyncSession = Depends(get_db),
) -> list[Category]:
    stmt = select(Category).order_by(Category.sort_order.desc(), Category.id)
    if status_filter is not None:
        stmt = stmt.where(Category.status == status_filter)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)) -> Category:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)) -> Category:
    existing = await db.execute(select(Category).where(Category.slug == data.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")

    existing_name = await db.execute(select(Category).where(Category.name == data.name))
    if existing_name.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")

    category = Category(**data.model_dump())
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(category_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db)) -> Category:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != category.slug:
        existing = await db.execute(select(Category).where(Category.slug == update_data["slug"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    if "name" in update_data and update_data["name"] != category.name:
        existing = await db.execute(select(Category).where(Category.name == update_data["name"]))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists")

    for key, value in update_data.items():
        setattr(category, key, value)

    await db.commit()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)) -> None:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    count_stmt = select(func.count()).select_from(Product).where(Product.category_id == category_id)
    count = (await db.execute(count_stmt)).scalar()
    if count and count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category has {count} products. Remove or reassign them first.",
        )

    await db.delete(category)
    await db.commit()


@router.get("/{category_id}/count")
async def category_product_count(category_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    stmt = select(func.count()).select_from(Product).where(Product.category_id == category_id, Product.status == 2)
    count = (await db.execute(stmt)).scalar() or 0
    return {"category_id": category_id, "product_count": count}
