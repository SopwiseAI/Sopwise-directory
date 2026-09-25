from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    database: str


class EnvResponse(BaseModel):
    env: str
    debug: bool


class ExportResponse(BaseModel):
    exported_at: str
    output_path: str
    categories_count: int
    products_count: int
    app_env: str


class CountResponse(BaseModel):
    count: int

    model_config = {"extra": "allow"}
