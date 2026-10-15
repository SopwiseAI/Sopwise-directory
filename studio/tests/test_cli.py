"""两个命令行入口: python -m app(起服务) 与 python -m app.db_init(建表)。

这两个入口存在的理由就是让 host/port 与库凭据【只由 app/core/config.py 解析一次】,
所以这里重点钉"它们确实按 Settings 的值拼参数", 而不是只断言不抛异常 ——
如果哪天有人把解析逻辑又抄回 Makefile, 这几条不会红, 但 `make dev` 的
host/port 会悄悄跟 .env 脱钩; 所以另外用一条用例盯住 Settings 到 uvicorn 的传递。
"""

import subprocess
from typing import Any

import pytest
from pydantic import ValidationError

from app.__main__ import main as serve_main
from app.core.config import Settings, get_settings
from app.db_init import _mysql_command
from app.db_init import main as db_init_main


def _fake_run(seen: dict[str, Any], returncode: int = 0):
    def run(cmd, **kwargs):
        seen["cmd"] = cmd
        seen.update(kwargs)
        return subprocess.CompletedProcess(cmd, returncode)

    return run


# ── db-init ───────────────────────────────────────────────────────────────────


def test_mysql_command_follows_settings_and_keeps_password_off_argv():
    settings = Settings(
        _env_file=None,
        db_host="db.internal",
        db_port=3307,
        db_name="xigee",
        db_user="u",
        db_password="p@ss word",
        api_key="k",
    )
    command = _mysql_command(settings)

    assert command[0] == "mysql"
    assert "--host=db.internal" in command
    assert "--port=3307" in command
    assert "--user=u" in command
    # 建连超时: 远端库 / VPN 不通时要快速失败, 不能挂着不出声
    assert "--connect-timeout=10" in command
    assert "--default-character-set=utf8mb4" in command
    assert command[-1] == "xigee"
    # 密码【不能】出现在命令行里: ps 对同机器所有用户可见
    assert not any("p@ss word" in part for part in command)


def test_db_init_pipes_schema_and_passes_password_via_env(monkeypatch):
    seen: dict[str, Any] = {}
    monkeypatch.setattr("app.db_init.shutil.which", lambda _name: "/usr/bin/mysql")
    monkeypatch.setattr("app.db_init.subprocess.run", _fake_run(seen))

    assert db_init_main() == 0

    settings = get_settings()
    assert seen["env"]["MYSQL_PWD"] == settings.db_password
    assert seen["cmd"][-1] == settings.db_name
    # 整份 schema.sql 是走 stdin 喂进去的, 不是拼进命令行
    assert "schema.sql" not in " ".join(seen["cmd"])


def test_db_init_reports_missing_mysql_client(monkeypatch):
    monkeypatch.setattr("app.db_init.shutil.which", lambda _name: None)

    assert db_init_main() == 1


def test_db_init_reports_missing_schema_file(monkeypatch, tmp_path):
    """DDL 文件不见了要报清楚, 而不是把 FileNotFoundError 抛给用户。"""
    monkeypatch.setattr("app.db_init.shutil.which", lambda _name: "/usr/bin/mysql")
    monkeypatch.setattr("app.db_init._SCHEMA_PATH", tmp_path / "not-here.sql")

    assert db_init_main() == 1


def test_db_init_reports_mysql_failure(monkeypatch):
    seen: dict[str, Any] = {}
    monkeypatch.setattr("app.db_init.shutil.which", lambda _name: "/usr/bin/mysql")
    monkeypatch.setattr("app.db_init.subprocess.run", _fake_run(seen, returncode=1))

    assert db_init_main() == 1


# ── python -m app ─────────────────────────────────────────────────────────────


def _capture_uvicorn(monkeypatch) -> dict[str, Any]:
    seen: dict[str, Any] = {}
    monkeypatch.setattr("app.__main__.uvicorn.run", lambda app_path, **kwargs: seen.update(kwargs, app_path=app_path))
    return seen


def test_serve_defaults_come_from_settings(monkeypatch):
    seen = _capture_uvicorn(monkeypatch)
    settings = get_settings()

    assert serve_main([]) == 0
    assert seen["host"] == settings.app_host
    assert seen["port"] == settings.app_port
    assert seen["reload"] is False


def test_serve_uses_import_string_so_reload_works(monkeypatch):
    """--reload 只对 import string 生效; 传 app 对象时 uvicorn 会报错退出。"""
    seen = _capture_uvicorn(monkeypatch)

    serve_main(["--reload"])

    assert seen["app_path"] == "app.main:app"
    assert seen["reload"] is True


def test_serve_cli_overrides_env(monkeypatch):
    seen = _capture_uvicorn(monkeypatch)

    serve_main(["--host", "0.0.0.0", "--port", "9000"])

    assert seen["host"] == "0.0.0.0"
    assert seen["port"] == 9000


def test_serve_help_works_without_a_valid_env(monkeypatch, capsys):
    """--help 不该因为 .env 还没填就炸出 pydantic 的 traceback。

    README 把 `python -m app --help` 写成"直接看入口支持的参数", 而新克隆下来
    .env.<env> 还不存在(或没填全), 那时恰好最需要看帮助。
    """

    def failing(*_args: Any, **_kwargs: Any) -> Settings:
        # 显式传空值: 进程环境里也可能带着 DB_* (CI 就是), 光靠 _env_file=None 挡不住
        return Settings(_env_file=None, db_host="", db_name="", db_user="", api_key="k")

    monkeypatch.setattr("app.__main__.get_settings", failing)

    with pytest.raises(SystemExit) as exc_info:
        serve_main(["--help"])

    assert exc_info.value.code == 0
    out = capsys.readouterr().out
    assert "--host" in out
    assert "--port" in out
    assert "--reload" in out


def test_serve_still_fails_fast_when_config_is_invalid(monkeypatch):
    """--help 之外仍要 fail fast: 配置非法时不能拿占位值把服务起起来。"""

    def failing(*_args: Any, **_kwargs: Any) -> Settings:
        return Settings(_env_file=None, db_host="", db_name="", db_user="", api_key="k")

    monkeypatch.setattr("app.__main__.get_settings", failing)

    with pytest.raises(ValidationError):
        serve_main([])
