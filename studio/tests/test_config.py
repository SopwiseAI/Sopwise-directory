"""Settings 校验与 database_url 编码测试, 不依赖 .env 文件。"""

from urllib.parse import unquote, urlparse

import pytest
from pydantic import ValidationError

from app.core.config import Settings

# 构造 Settings 时默认补一组合法的 DB_* 值。不补的话每个用例都会先因为
# db_name/db_user 为空报一个无关的 ValidationError, pytest.raises 照样"通过",
# 断言却退化成同义反复 —— 测 pool_size 的用例会被 db_name 的报错蒙混过关。
_DB_DEFAULTS = {"db_host": "localhost", "db_name": "testdb", "db_user": "tester"}


def _settings(**kwargs) -> Settings:
    kwargs.setdefault("_env_file", None)
    for key, value in _DB_DEFAULTS.items():
        kwargs.setdefault(key, value)
    return Settings(**kwargs)


def test_database_url_encodes_special_chars_in_password():
    s = _settings(db_password="a b@c/d")
    assert "a%20b%40c%2Fd" in s.database_url
    password = urlparse(s.database_url).password
    # password 的类型是 str | None; 先断言非 None, 否则 unquote(None) 抛的 TypeError
    # 会把"URL 里根本没有 password 段"这件事伪装成别的问题
    assert password is not None
    assert unquote(password) == "a b@c/d"


def test_database_url_encodes_db_name():
    s = _settings(db_password="p", db_name="my db")
    assert s.database_url.endswith("/my%20db?charset=utf8mb4")


def test_database_url_allows_empty_password():
    # 本地库允许空密码, 所以 db_password 是唯一不校验非空的 DB 键
    s = _settings(db_password="")
    assert s.database_url == "mysql+aiomysql://tester:@localhost:3306/testdb?charset=utf8mb4"


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
    # 这条只有在 _settings() 补齐合法 DB_* 之后才真的在测 db_pool_size
    with pytest.raises(ValidationError, match="db_pool_size"):
        _settings(db_pool_size=0)


def test_max_overflow_may_be_zero():
    # 0 是合法值(不允许溢出), 只有负数才拦
    assert _settings(db_max_overflow=0).db_max_overflow == 0
    with pytest.raises(ValidationError, match="db_max_overflow"):
        _settings(db_max_overflow=-1)


@pytest.mark.parametrize("field", ["db_host", "db_name", "db_user"])
def test_db_identity_rejects_blank(field):
    # 空值不会在启动时报错, 而是等第一次查询才炸出 aiomysql 的原始错误, 所以提前拦
    with pytest.raises(ValidationError, match=field):
        _settings(**{field: "   "})


def test_db_identity_is_stripped():
    assert _settings(db_name="  db  ").db_name == "db"


def test_cors_origins_rejects_empty():
    with pytest.raises(ValidationError, match="cors_origins"):
        _settings(cors_origins="  ,  ")


def test_cors_origins_rejects_wildcard_even_among_others():
    with pytest.raises(ValidationError, match="cors_origins"):
        _settings(cors_origins="http://a.test, *")


def test_cors_origin_list_strips_and_drops_blanks():
    assert _settings(cors_origins=" http://a.test ,, http://b.test ").cors_origin_list == [
        "http://a.test",
        "http://b.test",
    ]


def test_log_level_is_case_insensitive_and_closed_set():
    assert _settings(log_level="debug").log_level == "DEBUG"
    with pytest.raises(ValidationError, match="log_level"):
        _settings(log_level="verbose")


def test_export_output_dir_rejects_blank():
    # 空串会被 Path("") 解析成 ".", 产物静默落到源码目录里
    with pytest.raises(ValidationError, match="export_output_dir"):
        _settings(export_output_dir="   ")
