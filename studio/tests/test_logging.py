"""日志配置测试。

app/core/logging.py 的两条不变量:
  1. configure_logging 把 Settings 里的级别交给 logging
  2. 导入 app.main 本身【不】产生全局副作用(以前模块级 basicConfig 会)
"""

import logging
import subprocess
import sys
from pathlib import Path

from app.core.config import Settings
from app.core.logging import configure_logging

_STUDIO_ROOT = Path(__file__).resolve().parent.parent


def _settings(**kwargs) -> Settings:
    kwargs.setdefault("_env_file", None)
    for key, value in {"db_host": "localhost", "db_name": "testdb", "db_user": "tester"}.items():
        kwargs.setdefault(key, value)
    return Settings(**kwargs)


def test_configure_logging_passes_settings_level(monkeypatch):
    # logging.basicConfig 在 root 已有 handler(pytest 挂了)时是 no-op, 所以这里替换掉它,
    # 只断言我们确实把 Settings 的级别传了出去
    captured: dict = {}
    monkeypatch.setattr(logging, "basicConfig", lambda **kwargs: captured.update(kwargs))

    configure_logging(_settings(log_level="warning"))

    assert captured["level"] == "WARNING"
    assert "%(name)s" in captured["format"]


def test_importing_app_main_does_not_touch_root_logger():
    """在干净的解释器里 import app.main, root logger 不该被配置过。

    以前 app/main.py 在模块级调 logging.basicConfig, 于是任何 import 它的东西
    (测试、脚本、REPL)都会被动改掉全局日志配置。改成由 lifespan 显式配置之后,
    这里应该保持默认状态: 没有 handler, 级别还是 WARNING。
    """
    code = (
        "import logging, app.main\n"
        "root = logging.getLogger()\n"
        "assert root.handlers == [], root.handlers\n"
        "assert root.level == logging.WARNING, root.level\n"
        "print('clean')\n"
    )
    proc = subprocess.run(
        [sys.executable, "-c", code],
        cwd=_STUDIO_ROOT,
        capture_output=True,
        text=True,
        check=False,
    )

    assert proc.returncode == 0, proc.stderr
    assert proc.stdout.strip() == "clean"
