# XiGee Studio · 常用命令
#
# APP_ENV 是唯一的环境开关 (dev / sit / prod): 它既决定加载哪个 .env.<APP_ENV>,
# 也决定导出产物的后缀。命令行变量优先, 例如:
#   make db-init APP_ENV=prod
#   make dev PORT=9000
#
# 连接信息与监听地址都从 .env.<APP_ENV> 取, 取不到才落到下面的默认值 ——
# 不要在别处再抄一份默认值, 否则改了 .env 这里还是旧的。
#
# 取值的口径刻意与 python-dotenv(即服务侧 app/core/config.py 用的解析器)对齐:
# 吃掉 `export ` 前缀、`=` 两侧空白、值两侧的成对引号、行尾 CR, 同名取最后一个。
# 少这几步会让 make 与服务的连接信息【不一致】: 例如 DB_PASSWORD="p@ss word" 时
# mysql 客户端拿到的是带引号的串, 报 Access denied, 而服务连得上, 排查会绕远路。
# 仍然不支持行内注释(python-dotenv 只在 `#` 前有空白时才算注释), .env.example 已写明。
# 注意: 这里只服务 db-init 一个目标; 服务侧的唯一解析器始终是 app/core/config.py。
_env = $(shell sed -n 's/^[[:space:]]*\(export[[:space:]]\{1,\}\)\{0,1\}$1[[:space:]]*=[[:space:]]*//p' .env.$(APP_ENV) 2>/dev/null | sed -e 's/[[:space:]]*$$//' -e 's/^"\(.*\)"$$/\1/' -e "s/^'\(.*\)'\$$/\1/" | tr -d '\r' | tail -n 1)

APP_ENV ?= dev
HOST ?= $(or $(call _env,APP_HOST),127.0.0.1)
PORT ?= $(or $(call _env,APP_PORT),8000)
DB_HOST ?= $(or $(call _env,DB_HOST),127.0.0.1)
DB_PORT ?= $(or $(call _env,DB_PORT),3306)
DB_NAME ?= $(call _env,DB_NAME)
DB_USER ?= $(call _env,DB_USER)
DB_PASSWORD ?= $(call _env,DB_PASSWORD)

# prod 默认监听所有地址 (由前置的容器/反向代理转发); 要改成只听本机:
#   make prod PROD_HOST=127.0.0.1
PROD_HOST ?= 0.0.0.0

.PHONY: sync db-init dev sit prod lint format check test test-cov export-dev export-sit export-prod clean

# 测试会 TRUNCATE .env.<APP_ENV> 指向的那 4 张 xg_* 表, conftest.py 里有一道门禁:
# 目标库名字里没有 test 时必须显式放行, 否则 pytest 直接以退出码 3 退出(不碰库)。
# 默认的 dev 库是 10.182.32.31 上的共享 SIT 库, 所以需要显式:
#   make test ALLOW_SHARED_DB=1
# 这个变量只做透传, 默认空 —— 门禁的默认姿态仍然是"拒绝"。
ALLOW_SHARED_DB ?=

# 每个目标固定自己的 APP_ENV, 免得 make sit 却读了 .env.dev
dev export-dev: APP_ENV = dev
sit export-sit: APP_ENV = sit
prod export-prod: APP_ENV = prod

sync:
	uv sync

# 建表: 整份执行 sql/schema.sql (幂等, 可重复跑)。表结构的权威来源就是那个文件,
# 改表结构要同时改它并重跑这个目标 —— 启动服务不会自动建表。
# 密码走 MYSQL_PWD 而不是 -p<密码>: 后者会把密码暴露在 ps 的命令行里。
# 客户端必须带 utf8mb4: 脚本里有中文种子数据 (misc / 未分类)。
db-init:
	@command -v mysql >/dev/null 2>&1 || { echo "未找到 mysql 客户端, 请先安装 (与目标库同版本)"; exit 1; }
	@if [ -z "$(DB_NAME)" ] || [ -z "$(DB_USER)" ]; then \
		echo "DB_NAME / DB_USER 为空: 先 cp .env.example .env.$(APP_ENV) 并填写, 或命令行传入 (如 DB_NAME=x DB_USER=y make db-init)"; \
		exit 1; \
	fi
	MYSQL_PWD="$(DB_PASSWORD)" mysql --host="$(DB_HOST)" --port="$(DB_PORT)" --user="$(DB_USER)" \
		--default-character-set=utf8mb4 "$(DB_NAME)" < sql/schema.sql
	@echo "已应用 sql/schema.sql → $(DB_USER)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)"

dev:
	APP_ENV=dev uv run uvicorn app.main:app --reload --host $(HOST) --port $(PORT)

sit:
	APP_ENV=sit uv run uvicorn app.main:app --host $(HOST) --port $(PORT)

prod:
	APP_ENV=prod uv run uvicorn app.main:app --host $(PROD_HOST) --port $(PORT)

# 与根目录 package.json 的 lint:py 保持同一范围 (app/ + tests/), 避免两套标准
lint:
	uv run ruff check app/ tests/

format:
	uv run ruff format app/ tests/

check: lint
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
