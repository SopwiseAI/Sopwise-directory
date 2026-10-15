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
# 就绪探测必须同时满足两条, 缺一不可:
#   1. 端口被【本项目】的进程占着 —— 否则端口上若是别的服务, curl 一样返回 200,
#      会把"我们的服务没绑上"误判成"起来了"(实测被 python -m http.server 3000 骗过)
#   2. curl 真的拿到响应
# 只看第 2 条、或只看"包装进程还活着", 都会说谎。
ready=false
# 30s 而不是 15s: Next dev 冷启动实测 12s(干净 .next 上更久), 15s 会误报"启动失败"
for _ in $(seq 1 30); do
    if port_owned_by "$WEB_PORT" "$WEB_PATTERN" && curl -sf "http://127.0.0.1:$WEB_PORT" >/dev/null 2>&1; then
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
