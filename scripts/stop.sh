#!/usr/bin/env bash
# 停止服务
# 用法:
#   ./stop.sh           # 停止全部
#   ./stop.sh web       # 仅停止前端
#   ./stop.sh studio    # 仅停止后端
set -euo pipefail
source "$(dirname "$0")/lib.sh"

stop_web() {
    if is_running "$WEB_PID_FILE"; then
        local pid
        pid=$(cat "$WEB_PID_FILE")
        warn "停止 web (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        for i in $(seq 1 10); do
            sleep 0.5
            kill -0 "$pid" 2>/dev/null || break
        done
        kill -9 "$pid" 2>/dev/null || true
        info "web 已停止"
    else
        info "web 未运行"
    fi
    kill_port "$WEB_PORT" "web"
    cleanup_pid "$WEB_PID_FILE"
}

stop_studio() {
    if is_running "$STUDIO_PID_FILE"; then
        local pid
        pid=$(cat "$STUDIO_PID_FILE")
        warn "停止 studio (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        for i in $(seq 1 10); do
            sleep 0.5
            kill -0 "$pid" 2>/dev/null || break
        done
        kill -9 "$pid" 2>/dev/null || true
        info "studio 已停止"
    else
        info "studio 未运行"
    fi
    kill_port "$STUDIO_PORT" "studio"
    cleanup_pid "$STUDIO_PID_FILE"
}

case "${1:-all}" in
    all)    stop_web; stop_studio ;;
    web)    stop_web ;;
    studio) stop_studio ;;
    *)      error "用法: $0 [all|web|studio]"; exit 1 ;;
esac
