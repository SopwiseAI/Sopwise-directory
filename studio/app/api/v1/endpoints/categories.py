from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.models import Category, ProductCategory
from app.schemas.models import CategoryCountResponse, CategoryCreate, CategoryResponse, CategoryUpdate
from app.utils.db import check_unique, drop_none, published_category_counts

router = APIRouter()


async def _published_count(db: AsyncSession, category_id: int) -> int:
    """该分类下已发布 (status=2) 产品数, 与 /count 端点语义一致."""
    return (await published_category_counts(db, {category_id})).get(category_id, 0)


@router.get("", response_model=list[CategoryResponse])
async def list_categories(
    status_filter: int | None = Query(None, alias="status", ge=0, le=1),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
) -> list[CategoryResponse]:
    stmt = select(Category).order_by(Category.sort_order.desc(), Category.id)
    if status_filter is not None:
        stmt = stmt.where(Category.status == status_filter)
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    categories = list(result.scalars().all())

    cat_ids = [c.id for c in categories]
    count_map = await published_category_counts(db, cat_ids)
    for c in categories:
        c.product_count = count_map.get(c.id, 0)
    return categories


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(category_id: int, db: AsyncSession = Depends(get_db)) -> CategoryResponse:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    category.product_count = await _published_count(db, category_id)
    return category


@router.post(
    "", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_write)]
)
async def create_category(data: CategoryCreate, db: AsyncSession = Depends(get_db)) -> CategoryResponse:
    await check_unique(db, Category, Category.slug, data.slug, label="Slug")
    await check_unique(db, Category, Category.name, data.name, label="Category name")

    category = Category(**data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    category.product_count = 0
    return category


@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_write)])
async def update_category(
    category_id: int, data: CategoryUpdate, db: AsyncSession = Depends(get_db)
) -> CategoryResponse:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = drop_none(data.model_dump(exclude_unset=True), keep_none=("icon", "description"))
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
    category.product_count = await _published_count(db, category_id)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_write)])
async def delete_category(category_id: int, db: AsyncSession = Depends(get_db)) -> None:
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    count_stmt = select(func.count()).select_from(ProductCategory).where(ProductCategory.category_id == category_id)
    count = (await db.execute(count_stmt)).scalar() or 0
    if count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Category has {count} products (incl. unpublished). Remove or reassign them first.",
        )

    await db.delete(category)


@router.get("/{category_id}/count", response_model=CategoryCountResponse)
async def category_product_count(category_id: int, db: AsyncSession = Depends(get_db)) -> CategoryCountResponse:
    if not await db.get(Category, category_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    count = await _published_count(db, category_id)
    return CategoryCountResponse(product_count=count)
