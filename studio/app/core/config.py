import os
from functools import lru_cache
from pathlib import Path
from urllib.parse import quote_plus

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "dev"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_echo: bool = False

    export_output_path: str = "../web/data/data.json"

    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    api_key: str = "dev-secret-key"

    model_config = SettingsConfigDict(
        env_file=f".env.{os.getenv('APP_ENV', 'dev')}",
        env_file_encoding="utf-8",
    )

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v, info):
        env = info.data.get("app_env", "dev")
        if env != "dev" and v == "dev-secret-key":
            raise ValueError(
                f"api_key must be set to a non-default value in {env} environment (configure API_KEY in .env.{env})"
            )
        return v

    @property
    def database_url(self) -> str:
        return (
            f"mysql+aiomysql://{quote_plus(self.db_user)}:{quote_plus(self.db_password)}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def export_full_path(self) -> Path:
        path = Path(self.export_output_path)
        if not path.is_absolute():
            path = Path(__file__).resolve().parent.parent.parent / path
        return path


@lru_cache
def get_settings() -> Settings:
    return Settings()
