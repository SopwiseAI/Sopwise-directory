#!/usr/bin/env bash
# 停止服务
# 用法:
#   ./stop.sh           # 停止全部
#   ./stop.sh web       # 仅停止前端
#   ./stop.sh studio    # 仅停止后端
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

stop_service() {
    local name=$1 pid_file=$2 port=$3 pattern=$4

    if is_running "$pid_file" "$pattern"; then
        local pid
        pid=$(cat "$pid_file")
        warn "停止 $name (PID: $pid)..."
        kill "$pid" 2>/dev/null || true
        for _ in $(seq 1 10); do
            sleep 0.5
            kill -0 "$pid" 2>/dev/null || break
        done
        if kill -0 "$pid" 2>/dev/null; then
            warn "强制停止 $name..."
            kill -9 "$pid" 2>/dev/null || true
        fi
        info "$name 已停止"
    else
        info "$name 未运行"
    fi
    # PID 文件记的是 uv/pnpm 包装进程，真正在监听的是它的子进程 —— 所以这里再按
    # 端口 + 身份指纹收一次尾（认不出来的进程不会被碰）
    kill_port "$port" "$name" "$pattern"
    cleanup_pid "$pid_file"
}

case "${1:-all}" in
    all)
        stop_service "web" "$WEB_PID_FILE" "$WEB_PORT" "$WEB_PATTERN"
        stop_service "studio" "$STUDIO_PID_FILE" "$(studio_port)" "$STUDIO_PATTERN"
        ;;
    web)    stop_service "web" "$WEB_PID_FILE" "$WEB_PORT" "$WEB_PATTERN" ;;
    studio) stop_service "studio" "$STUDIO_PID_FILE" "$(studio_port)" "$STUDIO_PATTERN" ;;
    *)      error "用法: $0 [all|web|studio]"; exit 1 ;;
esac
