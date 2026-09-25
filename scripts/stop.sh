#!/usr/bin/env bash
# 停止服务
# 用法:
#   ./stop.sh           # 停止全部
#   ./stop.sh web       # 仅停止前端
#   ./stop.sh studio    # 仅停止后端
set -euo pipefail
source "$(dirname "$0")/lib.sh"

stop_service() {
    local name=$1
    local pid_file=$2
    local port=$3

    if is_running "$pid_file"; then
        local pid
        pid=$(cat "$pid_file")
        warn "停止 $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        for i in $(seq 1 10); do
            sleep 0.5
            kill -0 "$pid" 2>/dev/null || break
        done
        kill -9 "$pid" 2>/dev/null || true
        info "$name 已停止"
    else
        info "$name 未运行"
    fi
    kill_port "$port" "$name"
    cleanup_pid "$pid_file"
}

case "${1:-all}" in
    all)    stop_service "web" "$WEB_PID_FILE" "$WEB_PORT"; stop_service "studio" "$STUDIO_PID_FILE" "$STUDIO_PORT" ;;
    web)    stop_service "web" "$WEB_PID_FILE" "$WEB_PORT" ;;
    studio) stop_service "studio" "$STUDIO_PID_FILE" "$STUDIO_PORT" ;;
    *)      error "用法: $0 [all|web|studio]"; exit 1 ;;
esac
