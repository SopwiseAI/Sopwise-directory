#!/usr/bin/env bash
# 启动前端 (web) — 固定端口 3000
set -euo pipefail
source "$(dirname "$0")/lib.sh"

info "启动 web (Next.js) — 端口 $WEB_PORT"

kill_port "$WEB_PORT" "web"
cleanup_pid "$WEB_PID_FILE"

cd "$PROJECT_ROOT/web"
nohup pnpm dev --port "$WEB_PORT" > "$WEB_LOG_FILE" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$WEB_PID_FILE"

sleep 2
if is_running "$WEB_PID_FILE"; then
    info "web 已启动 (PID: $WEB_PID) → http://localhost:$WEB_PORT"
    info "日志: $WEB_LOG_FILE"
else
    error "web 启动失败，查看日志: $WEB_LOG_FILE"
    tail -20 "$WEB_LOG_FILE" 2>/dev/null || true
    exit 1
fi
