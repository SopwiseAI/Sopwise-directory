"""服务入口: python -m app [--host H] [--port P] [--reload]。

为什么不用 `uvicorn app.main:app --host ... --port ...`:
  host/port 存在 .env.<APP_ENV> 里, 走 uvicorn CLI 就必须由 Makefile 自己再解析一遍
  那个文件 —— 解析规则抄第二遍就会漂移(本仓库实测过: KEY="p@ss word" 引号不剥、
  `export KEY=v` 整行匹配不上、行尾 # 注释不剥)。这里让 app 自己读, app/core/config.py
  成为唯一的解析器。

优先级: 命令行 > .env.<APP_ENV> 里的 APP_HOST / APP_PORT。

--help 刻意【不】要求配置合法: 新克隆下来还没 cp .env.example、或 .env 里少填了值
时, 先看帮助是正常动作, 不该先吃一个 pydantic 的 traceback。
"""

import argparse
import sys

import uvicorn
from pydantic import ValidationError

from app.core.config import Settings, get_settings

# 只在"配置还不合法、但用户只想看帮助"时用来占位, 不会真的拿去监听
_FALLBACK_HOST = "127.0.0.1"
_FALLBACK_PORT = 8000


def _settings_or_none() -> Settings | None:
    """配置非法时返回 None —— 唯一目的是让 --help 还能打印出来。

    不在这里吞掉错误: main() 随后会再调一次 get_settings()(lru_cache 不缓存异常),
    该抛的 ValidationError 照样在启动前抛出来, 是 fail fast 不是静默降级。
    """
    try:
        return get_settings()
    except ValidationError:
        return None


def _build_parser(settings: Settings | None) -> argparse.ArgumentParser:
    shown_host = settings.app_host if settings else _FALLBACK_HOST
    shown_port = settings.app_port if settings else _FALLBACK_PORT
    env = settings.app_env if settings else "?"
    parser = argparse.ArgumentParser(
        prog="python -m app",
        description=f"启动 XiGee Studio API (APP_ENV={env}); 没给的参数取自 .env.{env}",
    )
    # default 留 None 而不是 settings 的值: 帮助里显示的默认值只是"提示",
    # 真正取值在 main() 里做 —— 否则配置没读到时占位值会被当成用户输入传下去
    parser.add_argument("--host", default=None, help=f"监听地址 (默认 {shown_host})")
    parser.add_argument("--port", type=int, default=None, help=f"监听端口 (默认 {shown_port})")
    parser.add_argument("--reload", action="store_true", help="改文件自动重启, 仅开发用")
    return parser


def main(argv: list[str] | None = None) -> int:
    settings = _settings_or_none()
    args = _build_parser(settings).parse_args(argv)
    if settings is None:
        # 走到这里说明不是 --help(那已在 argparse 里 exit 0), 那就该报配置错误了
        settings = get_settings()

    host = args.host if args.host is not None else settings.app_host
    port = args.port if args.port is not None else settings.app_port
    # 必须传 import string 而不是 app 对象: --reload 要能重新导入模块,
    # 传对象的话 uvicorn 会直接报错退出, 而那种失败只在开发时才看得见
    uvicorn.run("app.main:app", host=host, port=port, reload=args.reload)
    return 0


if __name__ == "__main__":
    sys.exit(main())
