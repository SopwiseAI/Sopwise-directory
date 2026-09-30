from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import require_write
from app.exporters.json_exporter import export_to_json
from app.schemas.common import ExportResponse

router = APIRouter()


@router.post("/export", response_model=ExportResponse, dependencies=[Depends(require_write)])
async def export_data(
    db: AsyncSession = Depends(get_db),
) -> ExportResponse:
    return await export_to_json(db)
