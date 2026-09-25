#!/usr/bin/env bash
# 触发 JSON 导出 — 输出 data-{env}.json，不覆盖 data.json
# 用法:
#   ./export.sh              # API 导出 (默认 dev)
#   ./export.sh --cli        # CLI 导出
#   APP_ENV=prod ./export.sh # 指定环境
set -euo pipefail
source "$(dirname "$0")/lib.sh"

API_KEY="${API_KEY:-${STUDIO_API_KEY:-dev-secret-key}}"
readonly API_KEY

CLI=false
for arg in "$@"; do
    case "$arg" in
        --cli)  CLI=true ;;
        *)      error "未知参数: $arg"; exit 1 ;;
    esac
done

EXPORT_ENV="${APP_ENV:-dev}"

if [[ "$CLI" == true ]]; then
    info "CLI 导出 [env: $EXPORT_ENV]..."
    cd "$PROJECT_ROOT/studio"
    APP_ENV="$EXPORT_ENV" uv run python -m app.exporters
else
    info "API 导出 [env: $EXPORT_ENV] → http://localhost:$STUDIO_PORT/api/v1/export"

    if ! is_running "$STUDIO_PID_FILE"; then
        error "studio 未运行，请先启动: ./scripts/dev-studio.sh"
        exit 1
    fi

    response=$(curl -sf -X POST "http://localhost:$STUDIO_PORT/api/v1/export" \
        -H "X-API-Key: $API_KEY" 2>&1) || {
        error "导出请求失败 (可能 studio 未运行或 API Key 错误)"
        error "响应: $response"
        exit 1
    }

    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
fi