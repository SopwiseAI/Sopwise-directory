from fastapi import APIRouter, Depends, Security
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.core.security import verify_api_key
from app.exporters.json_exporter import export_to_json
from app.schemas.common import ExportResponse

router = APIRouter()


@router.post("/export", response_model=ExportResponse, dependencies=[Security(verify_api_key)])
async def export_data(db: AsyncSession = Depends(get_db)) -> ExportResponse:
    result = await export_to_json(db)
    return ExportResponse(**result)
