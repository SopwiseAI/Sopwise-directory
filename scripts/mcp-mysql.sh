#!/usr/bin/env bash
# 启动 MySQL MCP server，根据 APP_ENV 从 studio/.env.{env} 加载数据库配置
# 用法: APP_ENV=dev  (默认 dev)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV="${APP_ENV:-dev}"
ENV_FILE="$SCRIPT_DIR/../studio/.env.${ENV}"

if [ ! -f "$ENV_FILE" ]; then
  echo "错误: 环境文件不存在: $ENV_FILE" >&2
  echo "请先创建: cp studio/.env.example $ENV_FILE" >&2
  exit 1
fi

# 读取 .env 文件并 export
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

# 映射到 MCP server 期望的变量名
export MYSQL_HOST="${DB_HOST:-localhost}"
export MYSQL_PORT="${DB_PORT:-3306}"
export MYSQL_USER="${DB_USER}"
export MYSQL_PASS="${DB_PASSWORD}"
export MYSQL_DB="${DB_NAME}"

# 默认只读; 需要写操作时设 MYSQL_ALLOW_WRITE=true
if [ "${MYSQL_ALLOW_WRITE:-false}" = "true" ]; then
  export ALLOW_INSERT_OPERATION="true"
  export ALLOW_UPDATE_OPERATION="true"
  export ALLOW_DELETE_OPERATION="true"
fi

exec npx -y @benborla29/mcp-server-mysql