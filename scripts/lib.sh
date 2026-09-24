#!/usr/bin/env bash
# 公共函数库 — 被所有脚本 source 引入

set -euo pipefail

# 项目根目录（lib.sh 所在目录的上级）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_DIR="$PROJECT_ROOT/scripts/run"

# 固定端口
WEB_PORT=3000
STUDIO_PORT=8000

# PID / 日志文件
WEB_PID_FILE="$RUN_DIR/web.pid"
STUDIO_PID_FILE="$RUN_DIR/studio.pid"
WEB_LOG_FILE="$RUN_DIR/web.log"
STUDIO_LOG_FILE="$RUN_DIR/studio.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 检查端口是否被占用，返回占用该端口的 PID（不含自身）
port_pid() {
    local port=$1
    lsof -ti :"$port" 2>/dev/null || true
}

# 通过 PID 文件检查进程是否存活
is_running() {
    local pid_file=$1
    [[ -f "$pid_file" ]] || return 1
    local pid
    pid=$(cat "$pid_file")
    [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# 杀掉占用指定端口的进程（可能多个）
kill_port() {
    local port=$1
    local name=$2
    local pids
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        warn "$name 端口 $port 被占用 (PID: $(echo "$pids" | tr '\n' ' '))，正在停止..."
        echo "$pids" | xargs kill 2>/dev/null || true
        # 等待端口释放（最多 5 秒）
        for i in $(seq 1 10); do
            sleep 0.5
            [[ -z "$(lsof -ti :"$port" 2>/dev/null || true)" ]] && break
        done
        # 仍未释放则强杀
        pids=$(lsof -ti :"$port" 2>/dev/null || true)
        if [[ -n "$pids" ]]; then
            echo "$pids" | xargs kill -9 2>/dev/null || true
            sleep 1
        fi
        info "$name 旧进程已停止"
    fi
}

# 清理 PID 文件
cleanup_pid() {
    local pid_file=$1
    rm -f "$pid_file"
}
