#!/usr/bin/env bash
# 启动前端 (web) — 固定端口 3000
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

info "启动 web (Next.js) — 端口 $WEB_PORT"

kill_port "$WEB_PORT" "web" "$WEB_PATTERN"
cleanup_pid "$WEB_PID_FILE"

cd "$PROJECT_ROOT/web"
nohup pnpm dev --port "$WEB_PORT" > "$WEB_LOG_FILE" 2>&1 &
WEB_PID=$!
echo "$WEB_PID" > "$WEB_PID_FILE"

info "等待 web 就绪..."
# 就绪探测的结论必须参与成败判断：只看"包装进程还活着"会说谎 ——
# 实测 pnpm 秒退（版本自管失败）时，脚本仍然报了"web 已启动 → localhost:3000"。
ready=false
for _ in $(seq 1 15); do
    if curl -sf "http://127.0.0.1:$WEB_PORT" >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 1
done

if [[ "$ready" == true ]] && is_running "$WEB_PID_FILE" "$WEB_PATTERN"; then
    info "web 已启动 (PID: $WEB_PID) → http://localhost:$WEB_PORT"
    info "日志: $WEB_LOG_FILE"
else
    error "web 启动失败 (就绪探测未通过: http://127.0.0.1:${WEB_PORT}), 查看日志: $WEB_LOG_FILE"
    tail -20 "$WEB_LOG_FILE" 2>/dev/null || true
    exit 1
fi
