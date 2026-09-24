#!/usr/bin/env bash
# 一键启动前端 + 后端
# 用法:
#   ./dev.sh              # 启动全部
#   ./dev.sh --web-only   # 仅前端
#   ./dev.sh --studio-only # 仅后端
set -euo pipefail
source "$(dirname "$0")/lib.sh"

START_WEB=true
START_STUDIO=true

while [[ $# -gt 0 ]]; do
    case "$1" in
        --web-only)     START_STUDIO=false ;;
        --studio-only)  START_WEB=false ;;
        *) error "未知参数: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sopwise Directory — Dev Launcher${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

if [[ "$START_WEB" == true ]]; then
    "$(dirname "$0")/dev-web.sh"
    echo ""
fi

if [[ "$START_STUDIO" == true ]]; then
    "$(dirname "$0")/dev-studio.sh"
    echo ""
fi

info "开发环境已就绪"
[[ "$START_WEB" == true ]]     && echo -e "  ${BLUE}web${NC}     → http://localhost:$WEB_PORT"
[[ "$START_STUDIO" == true ]]  && echo -e "  ${BLUE}studio${NC}  → http://localhost:$STUDIO_PORT/docs"
echo ""
warn "停止服务: ./scripts/stop.sh"
warn "查看状态: ./scripts/status.sh"
