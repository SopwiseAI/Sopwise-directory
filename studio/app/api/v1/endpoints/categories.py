from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.models import Category, Product
from app.schemas.common import CountResponse
from app.schemas.models import CategoryCreate, CategoryResponse, CategoryUpdate
from app.utils.db import check_unique

router = APIRouter()


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    status_filter: int | None = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[Category]:
    stmt = select(Category).order_by(Category.sort_order.desc(), Category.id)
    if status_filter is not None:
        stmt = stmt.where(Category.status == status_filter)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)) -> Category:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    return category


@router.post(
    "", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_write)]
)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)) -> Category:
    await check_unique(db, Category, Category.slug, data.slug, label="Slug")
    await check_unique(db, Category, Category.name, data.name, label="Category name")

    category = Category(**data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_write)])
async def update_category(category_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db)) -> Category:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    if "slug" in update_data and update_data["slug"] != category.slug:
        await check_unique(db, Category, Category.slug, update_data["slug"], exclude_id=category_id, label="Slug")
    if "name" in update_data and update_data["name"] != category.name:
        await check_unique(
            db, Category, Category.name, update_data["name"], exclude_id=category_id, label="Category name"
        )

    for key, value in update_data.items():
        setattr(category, key, value)

    await db.flush()
    await db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_write)])
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


@router.get("/{category_id}/count", response_model=CountResponse)
async def category_product_count(category_id: int, db: AsyncSession = Depends(get_db)) -> CountResponse:
    stmt = select(func.count()).select_from(Product).where(Product.category_id == category_id, Product.status == 2)
    count = (await db.execute(stmt)).scalar() or 0
    return CountResponse(count=count)
