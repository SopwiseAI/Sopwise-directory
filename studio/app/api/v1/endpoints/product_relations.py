from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.models import Product, ProductRelation, RelationType
from app.schemas.models import ProductRelationCreate, ProductRelationResponse, ProductRelationUpdate
from app.utils.db import drop_none

router = APIRouter()


@router.get("/{product_id}/relations", response_model=list[ProductRelationResponse])
async def list_product_relations(
    product_id: int,
    relation_type: RelationType | None = Query(None, alias="type"),
    db: AsyncSession = Depends(get_db),
) -> list[ProductRelationResponse]:
    stmt = select(ProductRelation).where(ProductRelation.product_id == product_id)
    if relation_type is not None:
        stmt = stmt.where(ProductRelation.relation_type == relation_type)
    stmt = stmt.order_by(ProductRelation.sort_order.desc(), ProductRelation.id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post(
    "/{product_id}/relations",
    response_model=ProductRelationResponse,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_write)],
)
async def create_product_relation(
    product_id: int,
    data: ProductRelationCreate,
    db: AsyncSession = Depends(get_db),
) -> ProductRelationResponse:
    if product_id == data.related_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Product cannot relate to itself")

    product = await db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source product not found")
    related = await db.get(Product, data.related_id)
    if not related:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Related product not found")

    existing = await db.execute(
        select(ProductRelation).where(
            ProductRelation.product_id == product_id,
            ProductRelation.related_id == data.related_id,
            ProductRelation.relation_type == data.relation_type,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Relation already exists")

    relation = ProductRelation(product_id=product_id, **data.model_dump())
    db.add(relation)
    await db.flush()
    await db.refresh(relation)
    return relation


@router.put(
    "/{product_id}/relations/{relation_id}",
    response_model=ProductRelationResponse,
    dependencies=[Depends(require_write)],
)
async def update_product_relation(
    product_id: int,
    relation_id: int,
    data: ProductRelationUpdate,
    db: AsyncSession = Depends(get_db),
) -> ProductRelationResponse:
    relation = await db.get(ProductRelation, relation_id)
    if not relation or relation.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found")

    update_data = drop_none(data.model_dump(exclude_unset=True))

    if "relation_type" in update_data and update_data["relation_type"] != relation.relation_type:
        existing = await db.execute(
            select(ProductRelation).where(
                ProductRelation.product_id == product_id,
                ProductRelation.related_id == relation.related_id,
                ProductRelation.relation_type == update_data["relation_type"],
                ProductRelation.id != relation_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Relation already exists")

    for key, value in update_data.items():
        setattr(relation, key, value)

    await db.flush()
    await db.refresh(relation)
    return relation


@router.delete(
    "/{product_id}/relations/{relation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_write)],
)
async def delete_product_relation(
    product_id: int,
    relation_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    relation = await db.get(ProductRelation, relation_id)
    if not relation or relation.product_id != product_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Relation not found")
    await db.delete(relation)
