#!/usr/bin/env bash
# 查看服务运行状态
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

show_status() {
    local name=$1
    local pid_file=$2
    local port=$3
    local pattern=$4

    local status="stopped"
    local color="$RED"
    local pid="-"
    local uptime="-"

    if is_running "$pid_file" "$pattern"; then
        pid=$(cat "$pid_file")
        status="running"
        color="$GREEN"
        local uptime_str
        # ps 在某些受限环境里会被拒绝执行（实测沙箱里就是 Operation not permitted）——
        # 少了 `|| true`，set -e 会让整个 status.sh 以 126 退出，连表都打不全
        uptime_str=$(ps -o etime= -p "$pid" 2>/dev/null || true)
        uptime="${uptime_str:--}"
    fi

    printf "  %b%-8s%b  %b%-10s%b  PID: %-6s  端口: %-5s  运行时长: %s\n" \
        "$BLUE" "$name" "$NC" "$color" "$status" "$NC" "$pid" "$port" "$uptime"
}

echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${CYAN}  XiGee — Service Status${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

STUDIO_PORT_NOW="$(studio_port)"
show_status "web"    "$WEB_PID_FILE"    "$WEB_PORT"        "$WEB_PATTERN"
show_status "studio" "$STUDIO_PID_FILE" "$STUDIO_PORT_NOW" "$STUDIO_PATTERN"

echo ""
if is_running "$WEB_PID_FILE" "$WEB_PATTERN" && is_running "$STUDIO_PID_FILE" "$STUDIO_PATTERN"; then
    info "所有服务运行中"
elif is_running "$WEB_PID_FILE" "$WEB_PATTERN" || is_running "$STUDIO_PID_FILE" "$STUDIO_PATTERN"; then
    warn "部分服务运行中"
else
    info "所有服务已停止"
fi
