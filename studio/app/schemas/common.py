from datetime import datetime

from pydantic import BaseModel

from app.core.config import AppEnv


class EnvResponse(BaseModel):
    env: AppEnv
    debug: bool


class HealthResponse(BaseModel):
    status: str
    database: str
    brand: str
    version: str


class ExportResponse(BaseModel):
    exported_at: datetime
    output_path: str
    categories_count: int
    products_count: int
    app_env: AppEnv
    synced_frontend: bool
