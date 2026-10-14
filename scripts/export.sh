#!/usr/bin/env bash
# 触发 JSON 导出 — 输出 topics-{env}.json / tools-{env}.json 环境副本; 仅 prod 同步前端数据源 topics.json / tools.json
# 用法:
#   ./export.sh              # API 导出 (默认 dev, 不碰 topics.json / tools.json)
#   ./export.sh --cli        # CLI 导出 (不走 HTTP, 直接调导出器)
#   APP_ENV=prod ./export.sh # prod 环境, 同步 topics.json / tools.json
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

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
    exit 0
fi

# 端口与 API Key 都问 app 要（唯一解析器 = studio/app/core/config.py）。
# 以前这里写死 `${API_KEY:-${STUDIO_API_KEY:-dev-secret-key}}`：sit/prod 的 Key 不在
# 环境变量里，于是"Key 不匹配"会被报成"studio 未运行或 Key 错误"，指向完全错的方向。
PORT="$(studio_port)"
API_KEY="${API_KEY:-$(studio_api_key)}"
if [[ -z "$API_KEY" ]]; then
    error "拿不到 API Key: 请确认 studio/.env.${EXPORT_ENV} 里配了 API_KEY, 或用 API_KEY=... 覆盖"
    exit 1
fi

info "API 导出 [env: $EXPORT_ENV] → http://localhost:$PORT/api/v1/export"

if ! is_running "$STUDIO_PID_FILE" "$STUDIO_PATTERN"; then
    error "studio 未运行，请先启动: ./scripts/dev-studio.sh"
    exit 1
fi

# 分开拿状态码与响应体: 401（Key 不匹配）与连不上（000）要给出不同的处置建议
raw=$(curl -s -w $'\n%{http_code}' -X POST "http://localhost:$PORT/api/v1/export" \
    -H "X-API-Key: $API_KEY" || true)
http_code="${raw##*$'\n'}"
body="${raw%$'\n'*}"

case "$http_code" in
    200)      echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body" ;;
    401)      error "API Key 不匹配（用的是 .env.${EXPORT_ENV} 里的 API_KEY）"; exit 1 ;;
    000|"")   error "连不上 studio: http://localhost:$PORT"; exit 1 ;;
    *)        error "导出失败 (HTTP $http_code): $body"; exit 1 ;;
esac
