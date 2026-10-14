#!/usr/bin/env bash
# 启动 MySQL MCP server，根据 APP_ENV 从 studio/.env.{env} 读取【只读所需】的库配置
# 用法: APP_ENV=dev  (默认 dev)
#
# 这里刻意【不】用 `set -a; source`（原来的写法）:
#   1. 它会把整份 .env —— 包括 API_KEY —— 导出给这个第三方 server，而它只需要库凭据
#   2. source 会真的执行文件内容，`KEY=$(cmd)` 里的命令会被跑起来
#
# 支持的最全写法: KEY=value / KEY="value" / KEY='value'，可带 `export ` 前缀、行尾注释、
# CRLF 行尾。不支持多行值与命令替换（后者正是要避免的）。
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV="${APP_ENV:-dev}"
ENV_FILE="$SCRIPT_DIR/../studio/.env.${ENV}"

if [ ! -f "$ENV_FILE" ]; then
    echo "错误: 环境文件不存在: $ENV_FILE" >&2
    echo "请先创建: cp studio/.env.example $ENV_FILE" >&2
    exit 1
fi

# 只挑 DB_* 五个键读出来，其它键（含 API_KEY）连读都不读
while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'\r'}"                                # CRLF 行尾（bash source 会带进值里）
    case "$line" in ''|'#'*) continue ;; esac           # 空行与整行注释
    line="${line#export }"                              # 允许 export 前缀
    key="${line%%=*}"
    value="${line#*=}"
    case "$key" in
        DB_HOST|DB_PORT|DB_NAME|DB_USER|DB_PASSWORD) ;;
        *) continue ;;
    esac
    value="${value%"${value##*[![:space:]]}"}"          # 去行尾空白
    # 引号优先: `KEY="a b"  # 注` 要的是 a b —— 先剥注释会把引号留在值里(实测踩过)
    case "$value" in
        \"*)
            value="${value#\"}"
            value="${value%%\"*}"                       # 到闭合引号为止, 之后的内容丢弃
            ;;
        \'*)
            value="${value#\'}"
            value="${value%%\'*}"
            ;;
        *)
            value="${value%%[[:space:]]#*}"             # 未加引号: 剥行尾注释
            value="${value%"${value##*[![:space:]]}"}"  # 再去掉剥注释后剩下的行尾空白
            ;;
    esac
    printf -v "$key" '%s' "$value"
done < "$ENV_FILE"

# 映射到 MCP server 期望的变量名
export MYSQL_HOST="${DB_HOST:-localhost}"
export MYSQL_PORT="${DB_PORT:-3306}"
: "${DB_USER:?错误: DB_USER 未在 .env.${ENV} 中设置}"
: "${DB_PASSWORD:?错误: DB_PASSWORD 未在 .env.${ENV} 中设置}"
: "${DB_NAME:?错误: DB_NAME 未在 .env.${ENV} 中设置}"
export MYSQL_USER="${DB_USER}"
export MYSQL_PASS="${DB_PASSWORD}"
export MYSQL_DB="${DB_NAME}"

# 默认只读; 需要写操作时设 MYSQL_ALLOW_WRITE=true
if [ "${MYSQL_ALLOW_WRITE:-false}" = "true" ]; then
    export ALLOW_INSERT_OPERATION="true"
    export ALLOW_UPDATE_OPERATION="true"
    export ALLOW_DELETE_OPERATION="true"
fi

# 这个 server 只需要库凭据: 把与库无关的凭据从子进程环境里摘掉
# （父进程若 export 过 API_KEY，exec 会原样传下去）
unset API_KEY STUDIO_API_KEY

# MCP server 由根 package.json 锁定精确版本（见 devDependencies），用本地 bin 执行，
# 避免 `npx -y` 在每次运行时从网络拉取未固定版本的代码并持有数据库凭据。
# MCP_BIN 可覆盖：换安装路径，或在测试里塞一个假 server 验环境传递。
MCP_BIN="${MCP_BIN:-$SCRIPT_DIR/../node_modules/.bin/mcp-server-mysql}"
if [ ! -x "$MCP_BIN" ]; then
    echo "错误: 未找到 $MCP_BIN" >&2
    echo "请先在仓库根目录执行: pnpm install" >&2
    exit 1
fi

exec "$MCP_BIN"
