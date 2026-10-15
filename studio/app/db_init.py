"""建表: python -m app.db_init —— 把 sql/schema.sql 整份喂给 mysql 客户端。

连接信息来自 app/core/config.py(唯一解析器), 不再由 Makefile 用 sed 抄一遍 dotenv
规则。那套 sed 的三种偏差都实测过, 前两种已在 sed 里补齐, 第三种一直没补:

    DB_PASSWORD="p@ss word"   sed 拿到带引号的串, 服务拿到剥引号的
    export DB_USER=alice      sed 整行匹配不上(拿到空), 服务拿到 alice
    DB_PORT=3306  # 主库      sed 拿到注释尾巴, 服务拿到 3306   ← 至今没补

结构上删掉第二份解析器才是终点, 所以整件事搬进了这里。

退出码: 0 = 成功; 1 = 失败(缺 mysql 客户端 / 找不到 DDL / 建表报错)。

密码走 MYSQL_PWD 环境变量而不是 `-p<password>`: 后者会把密码写进 ps 的命令行,
同机器上任何用户都看得到。
"""

import logging
import os
import shutil
import subprocess
import sys
from pathlib import Path

from app.core.config import Settings, get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)

_SCHEMA_PATH = Path(__file__).resolve().parent.parent / "sql" / "schema.sql"


def _mysql_command(settings: Settings) -> list[str]:
    """拼 mysql 客户端参数。抽成函数是为了能被单测直接断言(尤其是"密码不在里面")。"""
    return [
        "mysql",
        f"--host={settings.db_host}",
        f"--port={settings.db_port}",
        f"--user={settings.db_user}",
        # 建连超时: 库在远端 / 挂在 VPN 后面时, TCP 黑洞会让 mysql 客户端卡很久,
        # 表现为 make db-init 一直挂着不出声。只约束【建连】, 不约束 DDL 执行本身
        # (所以长事务/大表也不会被误杀)。
        "--connect-timeout=10",
        # 客户端必须带 utf8mb4: 脚本里有中文种子数据 (misc / 未分类), 不指定会写成乱码
        "--default-character-set=utf8mb4",
        settings.db_name,
    ]


def main() -> int:
    settings = get_settings()
    configure_logging(settings)

    if shutil.which("mysql") is None:
        logger.error("未找到 mysql 客户端, 请先安装 (与目标库同版本)")
        return 1
    if not _SCHEMA_PATH.is_file():
        logger.error("找不到 DDL 文件: %s", _SCHEMA_PATH)
        return 1

    target = f"{settings.db_user}@{settings.db_host}:{settings.db_port}/{settings.db_name}"
    # 命令行与参数全部由本文件构造, 没有任何外部输入; 也不用 shell
    with _SCHEMA_PATH.open("rb") as schema:
        completed = subprocess.run(  # noqa: S603
            _mysql_command(settings),
            stdin=schema,
            env={**os.environ, "MYSQL_PWD": settings.db_password},
            check=False,
        )

    if completed.returncode != 0:
        logger.error("建表失败(mysql 退出码 %s): %s", completed.returncode, target)
        return 1

    logger.info("已应用 sql/schema.sql → %s", target)
    return 0


if __name__ == "__main__":
    sys.exit(main())
