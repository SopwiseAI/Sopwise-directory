import logging
import os
from functools import lru_cache
from importlib.metadata import PackageNotFoundError
from importlib.metadata import version as pkg_version
from pathlib import Path
from typing import Literal
from urllib.parse import quote

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

logger = logging.getLogger(__name__)


def get_app_version() -> str:
    try:
        return pkg_version("studio")
    except PackageNotFoundError:
        return "0.0.0"


_STUDIO_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    app_env: Literal["dev", "sit", "prod"] = "dev"
    app_debug: bool = True
    app_host: str = "127.0.0.1"
    app_port: int = 8000

    db_host: str = "localhost"
    db_port: int = 3306
    db_name: str = ""
    db_user: str = ""
    db_password: str = ""
    db_pool_size: int = Field(5, ge=1)
    db_max_overflow: int = Field(10, ge=0)
    db_echo: bool = False

    export_output_path: str = "../web/data/data.json"

    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    api_key: str = "dev-secret-key"

    model_config = SettingsConfigDict(
        env_file=str(_STUDIO_ROOT / f".env.{os.getenv('APP_ENV', 'dev')}"),
        env_file_encoding="utf-8",
    )

    @field_validator("app_debug")
    @classmethod
    def validate_app_debug(cls, v, info):
        env = info.data.get("app_env", "dev")
        if env == "prod" and v:
            raise ValueError("app_debug must be False in prod (configure APP_DEBUG=false in .env.prod)")
        return v

    @field_validator("api_key")
    @classmethod
    def validate_api_key(cls, v, info):
        env = info.data.get("app_env", "dev")
        if not v:
            raise ValueError(f"api_key must not be empty (configure API_KEY in .env.{env})")
        if env != "dev" and v == "dev-secret-key":
            raise ValueError(
                f"api_key must be set to a non-default value in {env} environment (configure API_KEY in .env.{env})"
            )
        return v

    @property
    def database_url(self) -> str:
        return (
            f"mysql+aiomysql://{quote(self.db_user, safe='')}:{quote(self.db_password, safe='')}"
            f"@{self.db_host}:{self.db_port}/{quote(self.db_name, safe='')}?charset=utf8mb4"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def export_full_path(self) -> Path:
        path = Path(self.export_output_path)
        if not path.is_absolute():
            path = _STUDIO_ROOT / path
        return path.with_stem(f"{path.stem}-{self.app_env}")


@lru_cache
def get_settings() -> Settings:
    value = Settings()
    env_file = _STUDIO_ROOT / f".env.{value.app_env}"
    if not env_file.exists():
        logger.warning("Env file not found: %s (falling back to env vars/defaults)", env_file)
    return value
