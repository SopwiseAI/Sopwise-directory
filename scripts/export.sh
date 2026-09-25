#!/usr/bin/env bash
# 触发 JSON 导出 — 调用 studio API
# 用法:
#   ./export.sh              # 调用 API 导出 (默认 APP_ENV=dev)
#   ./export.sh --cli        # 直接 CLI 导出 (不走 HTTP)
#   APP_ENV=sit ./export.sh  # 指定环境
#   APP_ENV=prod ./export.sh --force  # 生产环境需 --force 确认
set -euo pipefail
source "$(dirname "$0")/lib.sh"

EXPORT_FILE="$PROJECT_ROOT/web/data/data.json"
BACKUP_FILE="$EXPORT_FILE.bak"

API_KEY="${API_KEY:-${STUDIO_API_KEY:-dev-secret-key}}"
readonly API_KEY
readonly EXPORT_FILE BACKUP_FILE

FORCE=false
CLI=false
for arg in "$@"; do
    case "$arg" in
        --cli)   CLI=true ;;
        --force) FORCE=true ;;
        *)       error "未知参数: $arg"; exit 1 ;;
    esac
done

# 确定导出环境
if [[ "$CLI" == true ]]; then
    EXPORT_ENV="${APP_ENV:-dev}"
else
    EXPORT_ENV="${APP_ENV:-dev}"
fi

# 环境安全检查: 非 dev 环境需 --force
if [[ "$EXPORT_ENV" != "dev" && "$FORCE" != true ]]; then
    warn "即将从 [$EXPORT_ENV] 环境导出数据，将覆盖生产文件:"
    warn "  $EXPORT_FILE"
    error "使用 --force 确认: APP_ENV=$EXPORT_ENV ./export.sh --force"
    exit 1
fi

# 备份现有文件
if [[ -f "$EXPORT_FILE" ]]; then
    cp "$EXPORT_FILE" "$BACKUP_FILE"
    info "已备份 → $BACKUP_FILE"
fi

# 执行导出
if [[ "$CLI" == true ]]; then
    info "CLI 导出 [env: $EXPORT_ENV]..."
    cd "$PROJECT_ROOT/studio"
    APP_ENV="$EXPORT_ENV" uv run python -m app.exporters
    info "导出完成 → $EXPORT_FILE"
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
        if [[ -f "$BACKUP_FILE" ]]; then
            cp "$BACKUP_FILE" "$EXPORT_FILE"
            warn "已从备份恢复 data.json"
        fi
        exit 1
    }

    info "导出完成"
    echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
fi