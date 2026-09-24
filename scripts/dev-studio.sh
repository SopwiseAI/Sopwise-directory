#!/usr/bin/env bash
# 启动后端 (studio) — 固定端口 8000
set -euo pipefail
source "$(dirname "$0")/lib.sh"

info "启动 studio (FastAPI) — 端口 $STUDIO_PORT"

kill_port "$STUDIO_PORT" "studio"
cleanup_pid "$STUDIO_PID_FILE"

cd "$PROJECT_ROOT/studio"
nohup env APP_ENV=dev uv run uvicorn app.main:app --reload \
    --host 0.0.0.0 --port "$STUDIO_PORT" > "$STUDIO_LOG_FILE" 2>&1 &
STUDIO_PID=$!
echo "$STUDIO_PID" > "$STUDIO_PID_FILE"

sleep 3
if is_running "$STUDIO_PID_FILE"; then
    info "studio 已启动 (PID: $STUDIO_PID) → http://localhost:$STUDIO_PORT"
    info "日志: $STUDIO_LOG_FILE"
else
    error "studio 启动失败，查看日志: $STUDIO_LOG_FILE"
    tail -20 "$STUDIO_LOG_FILE" 2>/dev/null || true
    exit 1
fi
