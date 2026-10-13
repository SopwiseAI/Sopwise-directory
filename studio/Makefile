# XiGee Studio · 常用命令
#
# APP_ENV 是唯一的环境开关 (dev / sit / prod): 它既决定加载哪个 .env.<APP_ENV>,
# 也决定导出产物的后缀。命令行变量优先, 例如:
#   make db-init APP_ENV=prod
#   make dev PORT=9000
#
# ⚠️ 这个文件【不解析 .env.<APP_ENV>】。服务侧的唯一解析器是 app/core/config.py,
# 监听地址与库凭据都由 app 自己读(见 app/__main__.py 与 app/db_init.py)。
# 以前这里用 sed 又抄了一套 dotenv 规则, 于是下面这几种写法会让 make 与服务拿到
# 不同的值 —— db-init 报 Access denied 而服务连得上, 排查会绕远路:
#   DB_PASSWORD="p@ss word"   引号没剥
#   export DB_USER=alice      整行匹配不上, 拿到空
#   DB_PORT=3306  # 主库     注释尾巴没剥
# 抄第二遍就是错, 别再加回来。

APP_ENV ?= dev

# 命令行可覆盖 .env.<APP_ENV> 里的监听地址; 留空就整个参数都不传, 交给 app 读配置
HOST ?=
PORT ?=
_HOST_ARG = $(if $(HOST),--host $(HOST),)
_PORT_ARG = $(if $(PORT),--port $(PORT),)

# prod 默认监听所有地址 (由前置的容器/反向代理转发); 要改成只听本机:
#   make prod PROD_HOST=127.0.0.1
PROD_HOST ?= 0.0.0.0

# 命令行给的 DB_* / APP_HOST / APP_PORT 原样透传给 app —— pydantic-settings 里
# 环境变量的优先级【高于】.env 文件(实测: DB_HOST=127.0.0.1 make db-init 生效),
# 所以临时指向别的库这条老用法照旧。
# 只透传确实有值的键: 没定义/空值的直接不出现, 免得把空串塞给 Settings 的必填校验。
_ENV_PASSTHROUGH = $(foreach v,DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD APP_HOST APP_PORT,$(if $($(v)),$(v)=$($(v)),))

.PHONY: sync db-init dev sit prod lint typecheck format check test test-cov export-dev export-sit export-prod clean

# 测试会 TRUNCATE .env.<APP_ENV> 指向的那 4 张 xg_* 表, conftest.py 里有一道门禁:
# 目标库名字里没有 test 时必须显式放行, 否则 pytest 直接以退出码 3 退出(不碰库)。
# 默认的 dev 库是 10.182.32.31 上的共享 SIT 库, 所以需要显式:
#   make test ALLOW_SHARED_DB=1
# 这个变量只做透传, 默认空 —— 门禁的默认姿态仍然是"拒绝"。
ALLOW_SHARED_DB ?=

sync:
	uv sync

# 建表: 整份执行 sql/schema.sql (幂等, 可重复跑)。表结构的权威来源就是那个文件,
# 改表结构要同时改它并重跑这个目标 —— 启动服务不会自动建表。
# 连接信息由 app/core/config.py 解析; 需要本机有 mysql 客户端(与目标库同版本)。
db-init:
	$(_ENV_PASSTHROUGH) APP_ENV=$(APP_ENV) uv run python -m app.db_init

dev:
	$(_ENV_PASSTHROUGH) APP_ENV=dev uv run python -m app --reload $(_HOST_ARG) $(_PORT_ARG)

sit:
	$(_ENV_PASSTHROUGH) APP_ENV=sit uv run python -m app $(_HOST_ARG) $(_PORT_ARG)

prod:
	$(_ENV_PASSTHROUGH) APP_ENV=prod uv run python -m app --host $(or $(HOST),$(PROD_HOST)) $(_PORT_ARG)

# 与根目录 package.json 的 lint:py 保持同一范围 (app/ + tests/), 避免两套标准
lint:
	uv run ruff check app/ tests/

# 类型检查覆盖 app/ + tests/; tests/ 用放宽的一层(不强制写签名), 阈值与理由都在
# pyproject 的 [tool.mypy] overrides 里
typecheck:
	uv run mypy app/ tests/

format:
	uv run ruff format app/ tests/

check: lint typecheck
	uv run ruff format --check app/ tests/

# 测试连真库: 每个用例前会 TRUNCATE 四张 xg_* 表, 见 tests/conftest.py。
# 必须指向可以随便清空的 dev/sit 库, 且先跑过 make db-init。
# 共享库(如默认 dev)还要显式放行: make test ALLOW_SHARED_DB=1
test:
	APP_ENV=dev STUDIO_ALLOW_SHARED_DB_TRUNCATE=$(ALLOW_SHARED_DB) uv run pytest -v

test-cov:
	APP_ENV=dev STUDIO_ALLOW_SHARED_DB_TRUNCATE=$(ALLOW_SHARED_DB) uv run pytest --cov=app --cov-report=term-missing -v

# 导出产物是【两个文件】: topics-{env}.json / tools-{env}.json
# (prod 额外同步无后缀的 topics.json / tools.json 给前端)。
export-dev:
	APP_ENV=dev uv run python -m app.exporters

export-sit:
	APP_ENV=sit uv run python -m app.exporters

# 会覆盖 web/data/topics.json 与 tools.json —— 那是前端的数据源, 确认要发布时再跑
export-prod:
	APP_ENV=prod uv run python -m app.exporters

clean:
	rm -rf .ruff_cache .pytest_cache .coverage
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
