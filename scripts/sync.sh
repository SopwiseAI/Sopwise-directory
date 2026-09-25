#!/usr/bin/env bash
# 一键安装所有依赖
set -euo pipefail
source "$(dirname "$0")/lib.sh"

echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo -e "${CYAN}  Sopwise Directory — Install Dependencies${NC}"
echo -e "${CYAN}════════════════════════════════════════════${NC}"
echo ""

info "安装根工程化依赖 (pnpm)..."
cd "$PROJECT_ROOT"
pnpm install
echo ""

info "安装 web 依赖 (pnpm)..."
cd "$PROJECT_ROOT/web"
pnpm install
echo ""

info "安装 studio 依赖 (uv)..."
cd "$PROJECT_ROOT/studio"
uv sync
echo ""

info "所有依赖安装完成"
