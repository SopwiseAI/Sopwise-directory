from pydantic import BaseModel


class EnvResponse(BaseModel):
    env: str
    debug: bool


class ExportResponse(BaseModel):
    exported_at: str
    output_path: str
    categories_count: int
    products_count: int
    app_env: str
    synced_frontend: bool
