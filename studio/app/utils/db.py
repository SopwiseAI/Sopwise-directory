from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def check_unique(
    db: AsyncSession,
    model,
    field,
    value: str,
    *,
    exclude_id: int | None = None,
    label: str = "Field",
) -> None:
    """Check that a field value is unique, raising 409 if it exists.

    Args:
        model: SQLAlchemy model class
        field: Column to check
        value: Value to check for
        exclude_id: If set, ignores the row with this id (for updates)
        label: Human-readable field name for error message
    """
    stmt = select(model.id).where(field == value)
    if exclude_id is not None:
        stmt = stmt.where(model.id != exclude_id)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{label} already exists",
        )
