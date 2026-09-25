#!/usr/bin/env bash
# 触发 JSON 导出 — 调用 studio API
# 用法:
#   ./export.sh              # 调用 API 导出
#   ./export.sh --cli        # 直接 CLI 导出（不走 HTTP）
set -euo pipefail
source "$(dirname "$0")/lib.sh"

API_KEY="${API_KEY:-${STUDIO_API_KEY:-}}"
if [[ -z "$API_KEY" ]]; then
    error "API_KEY 或 STUDIO_API_KEY 未设置"
    echo "  用法: API_KEY=xxx ./scripts/export.sh"
    echo "  或:   export STUDIO_API_KEY=xxx && ./scripts/export.sh"
    exit 1
fi
readonly API_KEY

if [[ "${1:-}" == "--cli" ]]; then
    info "CLI 导出 (直接执行)..."
    cd "$PROJECT_ROOT/studio"
    APP_ENV="${APP_ENV:-dev}" uv run python -m app.exporters
    info "导出完成 → $PROJECT_ROOT/web/data/data.json"
else
    info "API 导出 → http://localhost:$STUDIO_PORT/api/v1/export"

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

    info "导出完成"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
fi
