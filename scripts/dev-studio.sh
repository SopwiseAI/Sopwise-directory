#!/usr/bin/env bash
# 启动后端 (studio)
#
# 监听地址由 .env.<APP_ENV> 决定（app/core/config.py 是唯一解析器）：这里既不解析
# 也不硬编码 host/port，只问 app 要端口用于就绪探测与提示。走 `python -m app`
# 与 `make dev` 是同一个入口 —— 以前这里写死 `uvicorn app.main:app --host 127.0.0.1
# --port 8000`，于是 .env 里的 APP_HOST/APP_PORT 对脚本无效，出现了两套端口事实源。
set -euo pipefail
# shellcheck source=lib.sh
source "$(dirname "$0")/lib.sh"

APP_ENV="${APP_ENV:-dev}"
PORT="$(studio_port)"

info "启动 studio (FastAPI) — APP_ENV=$APP_ENV 端口 $PORT"

kill_port "$PORT" "studio" "$STUDIO_PATTERN"
cleanup_pid "$STUDIO_PID_FILE"

cd "$PROJECT_ROOT/studio"
nohup env APP_ENV="$APP_ENV" uv run python -m app --reload \
    > "$STUDIO_LOG_FILE" 2>&1 &
STUDIO_PID=$!
echo "$STUDIO_PID" > "$STUDIO_PID_FILE"
# 记下这次实际使用的端口: 之后用 stop.sh/status.sh 时不必再带同样的 APP_PORT 覆盖
printf '%s' "$PORT" > "$STUDIO_PORT_FILE"

info "等待 studio 就绪..."
# 就绪探测必须同时满足两条: 端口被【本项目】的进程占着 + curl 真的拿到响应。
# 只看 curl 或只看"包装进程还活着"都会说谎 —— 前者的坑是别的服务占着同一端口
# 也会返回 200(实测被 python -m http.server 骗过), 后者在包装进程秒退时也成立。
ready=false
for _ in $(seq 1 20); do
    if port_owned_by "$PORT" "$STUDIO_PATTERN" && curl -sf "http://127.0.0.1:$PORT/openapi.json" >/dev/null 2>&1; then
        ready=true
        break
    fi
    sleep 1
done

# PID 文件里记的是 `uv run` 包装进程（$!），不是 uvicorn 本身：停服务时靠
# kill_port 按身份指纹把整棵树收掉，见 lib.sh 的约定 2。
if [[ "$ready" == true ]] && is_running "$STUDIO_PID_FILE" "$STUDIO_PATTERN"; then
    info "studio 已启动 (PID: $STUDIO_PID) → http://localhost:$PORT"
    info "日志: $STUDIO_LOG_FILE"
else
    error "studio 启动失败 (就绪探测未通过: http://127.0.0.1:${PORT}/openapi.json), 查看日志: $STUDIO_LOG_FILE"
    tail -20 "$STUDIO_LOG_FILE" 2>/dev/null || true
    exit 1
fi
