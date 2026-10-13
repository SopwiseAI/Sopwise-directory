"""服务入口: python -m app [--host H] [--port P] [--reload]。

为什么不用 `uvicorn app.main:app --host ... --port ...`:
  host/port 存在 .env.<APP_ENV> 里, 走 uvicorn CLI 就必须由 Makefile 自己再解析一遍
  那个文件 —— 解析规则抄第二遍就会漂移(本仓库实测过: KEY="p@ss word" 引号不剥、
  `export KEY=v` 整行匹配不上、行尾 # 注释不剥)。这里让 app 自己读, app/core/config.py
  成为唯一的解析器。

优先级: 命令行 > .env.<APP_ENV> 里的 APP_HOST / APP_PORT。
"""

import argparse
import sys

import uvicorn

from app.core.config import get_settings


def _build_parser() -> argparse.ArgumentParser:
    settings = get_settings()
    parser = argparse.ArgumentParser(
        prog="python -m app",
        description=f"启动 XiGee Studio API (APP_ENV={settings.app_env}); 没给的参数取自 .env.{settings.app_env}",
    )
    parser.add_argument("--host", default=settings.app_host, help=f"监听地址 (默认 {settings.app_host})")
    parser.add_argument("--port", type=int, default=settings.app_port, help=f"监听端口 (默认 {settings.app_port})")
    parser.add_argument("--reload", action="store_true", help="改文件自动重启, 仅开发用")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = _build_parser().parse_args(argv)
    # 必须传 import string 而不是 app 对象: --reload 要能重新导入模块,
    # 传对象的话 uvicorn 会直接报错退出, 而那种失败只在开发时才看得见
    uvicorn.run("app.main:app", host=args.host, port=args.port, reload=args.reload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
