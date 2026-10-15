#!/usr/bin/env bash
# 公共函数库 — 被所有脚本 source 引入
#
# 两条硬约定（踩过坑才写下来的）:
#
#   1. 配置只有一个解析器。studio 的监听端口与 API Key 都存在 .env.<APP_ENV> 里，
#      由 studio/app/core/config.py 解析。脚本【不抄第二遍】—— 需要时直接问 app 要
#      (studio_port / studio_api_key)。抄第二遍就会出现"脚本与服务读到的不是同一份"：
#      实测 bash 的 `source` 与 pydantic-settings 在四类输入上结果不同 ——
#      `KEY=$(cmd)` 会被真的执行、CRLF 行尾会带 \r、`KEY=a b` 会报错、裸 `KEY` 会报错。
#
#   2. 杀进程前必须验身份。只看 PID 存活、或只看"谁占着这个端口"都会误杀无关进程
#      (PID 会被复用；端口可能被别的项目占着)。所有 kill 之前都用 pgrep -f 比对命令行，
#      认不出来的进程一律只告警、不动手。
#
# 变量用 export 声明是有意的：它们本来就是给 sourcing 的调用方用的，
# 也让 shellcheck 知道不是"定义了没人用"(SC2034)。

set -euo pipefail

# 项目根目录（lib.sh 所在目录的上级）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUN_DIR="$PROJECT_ROOT/scripts/.run"
mkdir -p "$RUN_DIR"

# web 没有配置文件，端口由这里定；studio 的端口见 studio_port()
export WEB_PORT=3000
export STUDIO_FALLBACK_PORT=8000

# 进程身份指纹（pgrep -f 的 ERE）：只有命令行匹配的进程才允许被停掉。
# 两段是必要的：PID 文件里记的是包装进程（uv run / pnpm），真正监听的是它的子进程，
# 两段命令行都要认得出来 —— 实测 `pnpm dev --port 3000` 的包装进程里并没有 "next dev"。
export STUDIO_PATTERN="python -m app|uvicorn app\.main:app"
export WEB_PATTERN="pnpm dev|next dev|next-server"

# PID / 端口 / 日志文件
export WEB_PID_FILE="$RUN_DIR/web.pid"
export STUDIO_PID_FILE="$RUN_DIR/studio.pid"
export WEB_LOG_FILE="$RUN_DIR/web.log"
export STUDIO_LOG_FILE="$RUN_DIR/studio.log"
# 运行中实例实际用的端口：启动时的 APP_PORT 可能和后来查配置时不同
# （实测：APP_PORT=8011 起，不带覆盖去 stop，端口兜底会去找 8000）
export STUDIO_PORT_FILE="$RUN_DIR/studio.port"

# 颜色
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 向 app 问一个配置值（$1 = Settings 的属性名）—— 这是"不抄第二份解析器"的落点。
# 读不到就返回非 0，由调用方决定回退还是报错。
app_query() {
    (
        cd "$PROJECT_ROOT/studio"
        APP_ENV="${APP_ENV:-dev}" uv run --quiet python -c \
            "from app.core.config import get_settings; print(getattr(get_settings(), '$1'))"
    ) 2>/dev/null
}

# studio 真正的监听端口。优先读【运行中实例】记下的端口（启动时的配置可能与现在不同），
# 否则问 app 要当前配置；都拿不到就回退并告警。
studio_port() {
    local port
    if [[ -f "$STUDIO_PORT_FILE" ]] && port=$(cat "$STUDIO_PORT_FILE") && [[ -n "$port" ]]; then
        printf '%s' "$port"
        return 0
    fi
    if port=$(app_query app_port) && [[ -n "$port" ]]; then
        printf '%s' "$port"
        return 0
    fi
    warn "读不到监听端口（.env 缺失或 uv 不可用），回退 ${STUDIO_FALLBACK_PORT}" >&2
    printf '%s' "$STUDIO_FALLBACK_PORT"
}

# studio 的 API Key（来自 .env.<APP_ENV>）。查不到则输出空串。
studio_api_key() {
    app_query api_key || true
}

# 通过 PID 文件 + 身份指纹判断服务是否在跑。
# $1 = pid 文件, $2 = pgrep -f 的 ERE
is_running() {
    local pid_file=$1 pattern=$2 pid
    [[ -f "$pid_file" ]] || return 1
    pid=$(cat "$pid_file")
    [[ -n "$pid" ]] || return 1
    kill -0 "$pid" 2>/dev/null || return 1
    # 身份校验：PID 会被复用，光看"存活"会把无关进程当成我们的服务
    pgrep -f -- "$pattern" 2>/dev/null | grep -qx "$pid"
}

# 端口是否被【本项目】的进程占着。
# 只看端口不看身份会认错人: 别的服务占着同一个端口时, 就绪探测里的 curl 一样返回 200
# —— 实测被 `python -m http.server 3000` 骗过一次(脚本报了"已启动", 而我们的服务根本没绑上)。
port_owned_by() {
    local port=$1 pattern=$2 pids matched pid
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    [[ -n "$pids" ]] || return 1
    matched=$(pgrep -f -- "$pattern" 2>/dev/null || true)
    while IFS= read -r pid; do
        [[ -n "$pid" ]] || continue
        grep -qx "$pid" <<< "$matched" && return 0
    done <<< "$pids"
    return 1
}

# 停掉占用 $1 端口的【本项目】进程；命令行匹配不上 $3 的只告警、不动手。
kill_port() {
    local port=$1 name=$2 pattern=$3
    local matched pids pid ours="" strangers=""
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    [[ -n "$pids" ]] || return 0

    matched=$(pgrep -f -- "$pattern" 2>/dev/null || true)
    while IFS= read -r pid; do
        [[ -n "$pid" ]] || continue
        if grep -qx "$pid" <<< "$matched"; then
            ours="$ours${ours:+ }$pid"
        else
            strangers="$strangers${strangers:+ }$pid"
        fi
    done <<< "$pids"

    if [[ -n "$strangers" ]]; then
        warn "$name 端口 $port 被【非本项目】进程占用 (PID: $strangers)，不动它 —— 请自行确认后再启动" >&2
    fi
    [[ -n "$ours" ]] || return 0

    warn "$name 端口 $port 上的旧进程 (PID: $ours)，正在停止..."
    # shellcheck disable=SC2086  # 有意分词：这里就是一串 PID
    kill $ours 2>/dev/null || true
    for _ in $(seq 1 10); do
        sleep 0.5
        [[ -z "$(lsof -ti :"$port" 2>/dev/null || true)" ]] && break
    done

    # 仍未释放：只强杀仍然认得出身份的
    pids=$(lsof -ti :"$port" 2>/dev/null || true)
    if [[ -n "$pids" ]]; then
        ours=""
        while IFS= read -r pid; do
            [[ -n "$pid" ]] || continue
            grep -qx "$pid" <<< "$matched" && ours="$ours${ours:+ }$pid"
        done <<< "$pids"
        if [[ -n "$ours" ]]; then
            warn "$name 仍在监听，强制停止 (PID: $ours)..."
            # shellcheck disable=SC2086  # 同上
            kill -9 $ours 2>/dev/null || true
            sleep 1
        fi
    fi
    info "$name 旧进程已停止"
}

# 清理 PID 文件（顺带清掉同名的 .port：那是"运行中实例"的端口记录）
cleanup_pid() {
    rm -f "$1" "${1%.pid}.port"
}
