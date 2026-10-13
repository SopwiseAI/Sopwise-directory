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

AppEnv = Literal["dev", "sit", "prod"]


def get_app_version() -> str:
    try:
        return pkg_version("studio")
    except PackageNotFoundError:
        return "0.0.0"


_STUDIO_ROOT = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    app_env: AppEnv = "dev"
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

    # 导出目录。产物是【两个文件】——与 studio/schema/*.data.jsonc 的顶层数组一致:
    #   topics-{env}.json / tools-{env}.json;prod 额外同步一份无后缀的 topics.json / tools.json
    export_output_dir: str = "../web/data"

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

    @field_validator("export_output_dir")
    @classmethod
    def validate_export_output_dir(cls, v: str) -> str:
        # 空串会被 Path("") 解析成"."(studio/ 本身), 产物静默落到源码目录里, 必须拦下
        if not v.strip():
            raise ValueError("export_output_dir 不能为空(默认 ../web/data)")
        return v.strip()

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, v: str) -> str:
        # main.py 里 allow_credentials=True 是写死的。Starlette 在这个组合下遇到 "*" 会把
        # 请求的 Origin 原样回显,等于对任意站点开放凭证;现在只用 X-API-Key(不是浏览器
        # 自动携带的凭证)所以风险有限,但哪天加了 Cookie 会话就是真漏洞。宁可启动失败。
        if "*" in {origin.strip() for origin in v.split(",")}:
            raise ValueError("cors_origins 不能用 *(allow_credentials=True 下会回显任意 Origin), 请逐个列白名单")
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
    def export_dir(self) -> Path:
        """导出目录(绝对路径)。

        相对路径按 studio/ 解析而不是进程 cwd —— 产物落在哪儿不该取决于谁在哪个目录下
        敲的命令;resolve() 只是把 studio/../web/data 里的 ".." 折掉, 让日志与
        ExportResponse.output_path 里的路径可读。
        """
        path = Path(self.export_output_dir)
        return (path if path.is_absolute() else _STUDIO_ROOT / path).resolve()

    def export_paths(self, *, frontend_names: bool = False) -> dict[str, Path]:
        """导出产物路径。

        frontend_names=True 时用无环境后缀的名字(topics.json / tools.json),
        只在 prod 下额外同步——开发产物带 -dev/-sit 后缀,避免误覆盖前端数据源。
        """
        suffix = "" if frontend_names else f"-{self.app_env}"
        directory = self.export_dir
        return {
            "topics": directory / f"topics{suffix}.json",
            "tools": directory / f"tools{suffix}.json",
        }


@lru_cache
def get_settings() -> Settings:
    value = Settings()
    env_file = _STUDIO_ROOT / f".env.{value.app_env}"
    if not env_file.exists():
        logger.warning("Env file not found: %s (falling back to env vars/defaults)", env_file)
    return value
