#!/usr/bin/env bash
# 查看服务运行状态
set -euo pipefail
source "$(dirname "$0")/lib.sh"

show_status() {
    local name=$1
    local pid_file=$2
    local port=$3

    local status="${RED}stopped${NC}"
    local pid="-"
    local uptime="-"

    if is_running "$pid_file"; then
        pid=$(cat "$pid_file")
        status="${GREEN}running${NC}"
        local uptime_str
        uptime_str=$(ps -o etime= -p "$pid" 2>/dev/null | tr -d ' ')
        uptime="${uptime_str:--}"
    fi

    printf "  ${BLUE}%-8s${NC}  %-10b  PID: %-6s  端口: %-5s  运行时长: %s\n" \
        "$name" "$status" "$pid" "$port" "$uptime"
}

echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sopwise Directory — Service Status${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

show_status "web"    "$WEB_PID_FILE"    "$WEB_PORT"
show_status "studio" "$STUDIO_PID_FILE" "$STUDIO_PORT"

echo ""
if is_running "$WEB_PID_FILE" && is_running "$STUDIO_PID_FILE"; then
    info "所有服务运行中"
elif is_running "$WEB_PID_FILE" || is_running "$STUDIO_PID_FILE"; then
    warn "部分服务运行中"
else
    info "所有服务已停止"
fi
