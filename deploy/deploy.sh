#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════════════════
# Sopwise Directory · Studio 日常更新脚本
# 用法: bash deploy/deploy.sh
#
# 职责:
#   1. git pull 拉取最新代码
#   2. uv sync 更新依赖
#   3. 重启 studio 服务
#   4. 健康检查验证
# ══════════════════════════════════════════════════════════════════════════
set -euo pipefail

STUDIO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
HEALTH_URL="http://127.0.0.1:8000/api/v1/health"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
info()  { echo -e "${GREEN}[✓]${NC} $*"; }
warn()  { echo -e "${YELLOW}[!]${NC} $*"; }
err()   { echo -e "${RED}[✗]${NC} $*" >&2; }

# ── 1. 前置检查 ─────────────────────────────────────────────────────────
cd "$STUDIO_DIR"

if [[ ! -d .git ]]; then
    err "当前目录不是 git 仓库，请在 studio 根目录运行"
    exit 1
fi

if [[ ! -f .env.prod ]]; then
    err ".env.prod 不存在！请先运行 setup.sh 或手动创建"
    exit 1
fi

# ── 2. 拉取代码 ─────────────────────────────────────────────────────────
info "拉取最新代码..."
git fetch origin
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")

if [[ "$LOCAL" == "$REMOTE" ]]; then
    info "已是最新，无需更新"
fi

git reset --hard origin/HEAD
info "代码已更新 ($(git log --oneline -1))"

# ── 3. 更新依赖 ─────────────────────────────────────────────────────────
info "更新 Python 依赖..."
uv sync --frozen 2>/dev/null || uv sync
info "依赖已更新"

# ── 4. 数据库 Schema 检查（非迁移，仅确保表存在） ──────────────────────
if [[ -f sql/schema.sql ]]; then
    info "检查数据库表结构..."
    if command -v mysql &>/dev/null; then
        source <(grep -E '^DB_' .env.prod | sed 's/^/export /')
        mysql -h "$DB_HOST" -P "${DB_PORT:-3306}" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < sql/schema.sql 2>/dev/null && \
            info "表结构已同步" || warn "schema 同步跳过（mysql CLI 不可用或无权限）"
    fi
fi

# ── 5. 重启服务 ─────────────────────────────────────────────────────────
info "重启 studio 服务..."
sudo systemctl restart studio
info "服务已重启"

# ── 6. 健康检查 ─────────────────────────────────────────────────────────
info "等待 studio 就绪..."
for i in $(seq 1 10); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [[ "$STATUS" == "200" ]]; then
        info "部署完成！健康检查通过"
        curl -s "$HEALTH_URL" | python3 -m json.tool 2>/dev/null || true
        exit 0
    fi
    echo -n "."
    sleep 3
done

echo ""
err "健康检查超时！请手动排查: journalctl -u studio -n 50 --no-pager"
exit 1