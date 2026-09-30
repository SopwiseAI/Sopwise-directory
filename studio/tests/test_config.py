"""Settings 校验与 database_url 编码测试, 不依赖 .env 文件。"""

from urllib.parse import unquote, urlparse

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def _settings(**kwargs) -> Settings:
    kwargs.setdefault("_env_file", None)
    return Settings(**kwargs)


def test_database_url_encodes_special_chars_in_password():
    s = _settings(db_user="u", db_password="a b@c/d", db_name="db")
    assert "a%20b%40c%2Fd" in s.database_url
    assert unquote(urlparse(s.database_url).password) == "a b@c/d"


def test_database_url_encodes_db_name():
    s = _settings(db_user="u", db_password="p", db_name="my db")
    assert s.database_url.endswith("/my%20db?charset=utf8mb4")


def test_app_env_rejects_unknown_value():
    with pytest.raises(ValidationError):
        _settings(app_env="production")


def test_api_key_must_not_be_empty():
    with pytest.raises(ValidationError):
        _settings(app_env="dev", api_key="")


def test_api_key_default_rejected_outside_dev():
    with pytest.raises(ValidationError):
        _settings(app_env="prod", app_debug=False, api_key="dev-secret-key")


def test_debug_true_rejected_in_prod():
    with pytest.raises(ValidationError):
        _settings(app_env="prod", app_debug=True, api_key="strong-key")


def test_pool_size_must_be_positive():
    with pytest.raises(ValidationError):
        _settings(db_pool_size=0)
