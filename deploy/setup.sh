#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
# Sopwise Directory · Studio 一键部署脚本（首次初始化用）
# 用法: sudo bash deploy/setup.sh
#
# 职责:
#   1. 安装系统依赖 (nginx, uv, Python 3.x)
#   2. 创建 sopwise 用户与目录结构
#   3. 拉取代码、安装 Python 依赖
#   4. 交互式配置 .env.prod
#   5. 注册 systemd 服务 + nginx 站点
#   6. 启动所有服务并验证
# ══════════════════════════════════════════════════════════════════════════
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/SopwiseAI/Sopwise-directory.git}"
BRANCH="${BRANCH:-main}"
INSTALL_DIR="/opt/sopwise"
STUDIO_DIR="$INSTALL_DIR/studio"
WEB_DIR="$INSTALL_DIR/web"
SOPWISE_USER="sopwise"

# ── 颜色输出 ─────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
err()   { echo -e "${RED}[✗]${NC} $*" >&2; }
step()  { echo -e "\n${YELLOW}━━━ $* ━━━${NC}"; }

# ── 前置检查 ─────────────────────────────────────────────────────────────
step "前置检查"

if [[ $EUID -ne 0 ]]; then
    err "请以 root 身份运行: sudo bash deploy/setup.sh"
    exit 1
fi

# ── 1. 安装系统依赖 ─────────────────────────────────────────────────────
step "1/6 · 安装系统依赖"

if command -v apt-get &>/dev/null; then
    apt-get update -qq
    apt-get install -y -qq curl git nginx python3 python3-pip python3-venv
elif command -v yum &>/dev/null; then
    yum install -y -q curl git nginx python3 python3-pip
else
    err "不支持的包管理器，仅支持 apt (Ubuntu/Debian) 和 yum (CentOS)"
    exit 1
fi

# 安装 uv（如果尚未安装）
if ! command -v uv &>/dev/null; then
    info "安装 uv 包管理器..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    # uv 安装到 ~/.local/bin，复制到全局路径
    if [[ -f "$HOME/.local/bin/uv" ]]; then
        cp "$HOME/.local/bin/uv" /usr/local/bin/uv
    fi
fi
info "系统依赖就绪"

# ── 2. 创建用户与目录 ───────────────────────────────────────────────────
step "2/6 · 创建用户与目录"

if ! id "$SOPWISE_USER" &>/dev/null; then
    useradd -r -s /bin/bash -d "$INSTALL_DIR" -m "$SOPWISE_USER"
    info "创建用户 $SOPWISE_USER"
fi

mkdir -p "$INSTALL_DIR"
chown "$SOPWISE_USER:$SOPWISE_USER" "$INSTALL_DIR"

# ── 3. 拉取代码 ─────────────────────────────────────────────────────────
step "3/6 · 拉取代码"

if [[ -d "$STUDIO_DIR/.git" ]]; then
    info "代码已存在，更新..."
    su - "$SOPWISE_USER" -c "cd '$STUDIO_DIR' && git fetch origin && git reset --hard origin/$BRANCH"
else
    su - "$SOPWISE_USER" -c "git clone --branch '$BRANCH' '$REPO_URL' '$STUDIO_DIR'"
    info "克隆完成"
fi

# ── 4. 配置环境变量 ─────────────────────────────────────────────────────
step "4/6 · 配置环境变量"

ENV_FILE="$STUDIO_DIR/.env.prod"
if [[ -f "$ENV_FILE" ]]; then
    info ".env.prod 已存在，跳过"
    echo "   当前内容（密钥已隐藏）:"
    grep -v 'PASSWORD\|API_KEY' "$ENV_FILE" | sed 's/^/   /'
else
    warn "请输入生产环境配置（留空 = 使用默认值）"
    read -rp "  DB_HOST: " DB_HOST
    read -rp "  DB_PORT [3306]: " DB_PORT
    read -rp "  DB_NAME: " DB_NAME
    read -rp "  DB_USER: " DB_USER
    read -srp "  DB_PASSWORD: " DB_PASSWORD; echo
    read -rp "  CORS_ORIGINS [https://www.xigee.net]: " CORS_ORIGINS
    read -srp "  API_KEY (随机生成，留空自动): " API_KEY; echo
    API_KEY="${API_KEY:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')}"
    CORS_ORIGINS="${CORS_ORIGINS:-https://www.xigee.net}"

    cat > "$ENV_FILE" <<ENVEOF
# 生产环境配置 (PROD)
APP_ENV=prod
APP_DEBUG=false

# MySQL
DB_HOST=${DB_HOST:-}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-}
DB_USER=${DB_USER:-}
DB_PASSWORD=${DB_PASSWORD:-}
DB_POOL_SIZE=10
DB_MAX_OVERFLOW=20

# CORS
CORS_ORIGINS=$CORS_ORIGINS

# API Key
API_KEY=$API_KEY
ENVEOF
    chown "$SOPWISE_USER:$SOPWISE_USER" "$ENV_FILE"
    chmod 600 "$ENV_FILE"
    info ".env.prod 已创建"
fi

# ── 5. 安装 Python 依赖 + 数据库初始化 ──────────────────────────────────
step "5/6 · 安装依赖"

su - "$SOPWISE_USER" -c "cd '$STUDIO_DIR' && uv sync --frozen" || \
    su - "$SOPWISE_USER" -c "cd '$STUDIO_DIR' && uv sync"
info "Python 依赖安装完成"

# ── 6. 注册服务并启动 ───────────────────────────────────────────────────
step "6/6 · 注册服务并启动"

# systemd
cp "$STUDIO_DIR/deploy/studio.service" /etc/systemd/system/studio.service
systemctl daemon-reload
systemctl enable studio
systemctl restart studio
info "studio.service 已启动"

# nginx
if [[ -f "$STUDIO_DIR/deploy/nginx.conf" ]]; then
    cp "$STUDIO_DIR/deploy/nginx.conf" /etc/nginx/sites-available/studio
    ln -sf /etc/nginx/sites-available/studio /etc/nginx/sites-enabled/ 2>/dev/null || true
    # 移除默认站点
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    info "nginx 已配置"
fi

# ── 健康检查 ─────────────────────────────────────────────────────────────
step "验证部署"

echo -n "  等待 studio 启动..."
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:8000/api/v1/health >/dev/null 2>&1; then
        echo -e "\n${GREEN}"
        curl -s http://127.0.0.1:8000/api/v1/health | python3 -m json.tool
        echo -e "${NC}"
        info "部署成功!"
        exit 0
    fi
    echo -n "."
    sleep 2
done

echo -e "\n${RED}"
err "健康检查超时，请排查: journalctl -u studio -n 50 --no-pager"
echo -e "${NC}"
exit 1