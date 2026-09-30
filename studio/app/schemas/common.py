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
    exported_at: str
    output_path: str
    categories_count: int
    products_count: int
    app_env: str
    synced_frontend: bool
