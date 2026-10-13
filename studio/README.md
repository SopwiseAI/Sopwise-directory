# Studio

XiGee (AI 工具目录站) 的数据管理后端:FastAPI + SQLAlchemy 2.0 (async) + MySQL。对外提供主题/工具的 CRUD 接口,并把库里的数据导出成前端直接消费的 JSON。

数据模型只有两个实体:

- 主题 (Topic):导航骨架,受控在 20~30 个,扁平,不做层级
- 工具 (Tool):卡片数据。标签是 `xg_tool.tags` JSON 列,不是独立表,也没有 `/tags` 接口

## 环境要求

| 依赖         | 版本       | 说明                                                |
| ------------ | ---------- | --------------------------------------------------- |
| Python       | >= 3.13    | `.python-version` 固定 3.13,`uv` 据此挑解释器       |
| uv           | >= 0.11    | 依赖管理与运行入口 (`make sync` / `uv run`)         |
| MySQL        | 5.7 或 8.0 | dev 库是 5.7,prod 库是 8.0;DDL 只用两边都支持的写法 |
| mysql 客户端 | 与库同版本 | 仅 `make db-init` 建表时用到                        |

## 数据流

```text
MySQL (xg_topic / xg_tool / xg_tool_topic / xg_tool_link)
  ↑ ↓  Studio CRUD (FastAPI)
      ↓  make export-dev / export-sit / export-prod
web/data/topics-dev.json + tools-dev.json       ← 非 prod 只写带环境后缀的副本
web/data/topics.json     + tools.json           ← prod 额外同步, 前端数据源
```

## 快速开始

```bash
# 1. 准备配置 (.env.<env> 已被 .gitignore 忽略, 不会进版本库)
cp .env.example .env.dev
$EDITOR .env.dev      # 至少填 DB_HOST / DB_NAME / DB_USER / DB_PASSWORD / API_KEY

# 2. 安装依赖
make sync             # 等价于 uv sync

# 3. 建表 (幂等, 可重复执行)
make db-init          # 用 .env.dev 的连接信息执行 sql/schema.sql

# 4. 启动
make dev              # 开发; --reload; 默认 http://127.0.0.1:8000
```

启动日志第一条会打印 `Studio starting [dev] | DB: <host>:<port>/<name>`,用它确认连的是哪个库。

## 数据库初始化

建表**必须单独做这一步**,启动服务不会自动建表。

- 权威 DDL 是 `sql/schema.sql`,一共 4 张表;`make db-init` 就是把它整份喂给 mysql 客户端
- 脚本是幂等的 (`CREATE TABLE IF NOT EXISTS` + 幂等种子),重复执行安全
- 连接信息按 `APP_ENV` 从 `.env.<APP_ENV>` 读 (默认 `dev`);也可以命令行覆盖,例如 `make db-init APP_ENV=prod` 或 `DB_HOST=127.0.0.1 make db-init`
- 客户端会带上 `--default-character-set=utf8mb4`:脚本里有中文种子数据 (`misc` / `未分类`),不指定字符集会写成乱码

| 表              | 说明                                       | 关系                                                      |
| --------------- | ------------------------------------------ | --------------------------------------------------------- |
| `xg_topic`      | 主题 (导航骨架)                            | 被 `xg_tool_topic` 外键 RESTRICT,不能直接删还有工具的主题 |
| `xg_tool`       | 工具主表,`tags` / `languages` 都是 JSON 列 | 删除时级联删关联与链接                                    |
| `xg_tool_topic` | 工具-主题 N:M,`is_primary` 标记主主题      | 每个工具至多一个主主题 (app 保证)                         |
| `xg_tool_link`  | 工具链接 1:N,`url_normalized` 是导出用的值 | 每个工具至多一个主链接 (app 保证)                         |

两条容易踩的设计约定:

- **库层没有 CHECK / ENUM**(为兼容 MySQL 5.7 且加值不用 DDL),值域校验全在 `app/schemas` 的 Pydantic 里。绕过 API 直连改库要自己保证取值合法,否则导出会因枚举越界整体中断
- 不用软删除,靠 `status` 管理;导出只取 `topic.status='active'` 与 `tool.status='published'` 且存在 active 链接的行

## 环境变量

模板是 `.env.example` (唯一可提交的 env 文件),`APP_ENV` 决定加载哪个 `.env.<env>`。

| 变量                                  | 默认值                                        | 说明                                                                                      |
| ------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `APP_ENV`                             | `dev`                                         | `dev` / `sit` / `prod`;决定加载哪个 `.env.<env>`,也决定导出产物后缀                       |
| `APP_DEBUG`                           | `true`                                        | prod 下必须为 `false`,否则启动直接失败                                                    |
| `APP_HOST` / `APP_PORT`               | `127.0.0.1` / `8000`                          | `make dev` / `make sit` 的监听地址;`make prod` 默认监听 `0.0.0.0` (可用 `PROD_HOST` 覆盖) |
| `DB_HOST` / `DB_PORT`                 | `localhost` / `3306`                          | MySQL 地址                                                                                |
| `DB_NAME` / `DB_USER` / `DB_PASSWORD` | 空                                            | 必填;密码里的特殊字符会被 URL 转义,不用手写 `%40`                                         |
| `DB_POOL_SIZE` / `DB_MAX_OVERFLOW`    | `5` / `10`                                    | 连接池;测试进程用 `NullPool`,这两个值不生效                                               |
| `DB_ECHO`                             | `false`                                       | 打印 SQL;只在本地排查问题时打开                                                           |
| `EXPORT_OUTPUT_DIR`                   | `../web/data`                                 | 导出目录,相对路径按 `studio/` 解析 (与 cwd 无关)                                          |
| `CORS_ORIGINS`                        | `http://localhost:3000,http://localhost:5173` | 逗号分隔白名单,**不接受 `*`** (启动时校验并拒绝)                                          |
| `API_KEY`                             | `dev-secret-key`                              | 写操作的 `X-API-Key`;`sit` / `prod` 不允许留默认值                                        |

两个必须知道的坑:

- pydantic-settings 默认 `extra="forbid"`,`.env.<env>` 里出现**未知键**会让服务直接起不来 (`Extra inputs are not permitted`)。已废弃的 `EXPORT_OUTPUT_PATH` 就是这样一个键:改名后只能写 `EXPORT_OUTPUT_DIR`,写错不要以为是注释无效
- `EXPORT_OUTPUT_DIR` 是**目录**不是文件。旧文档里的值形如 `../web/data/data.json`,照抄会建出一个叫 `data.json` 的目录

## 导出产物

一次导出写**两个文件**,不是单个 `data.json`:

| 环境          | 产物                                                                                            |
| ------------- | ----------------------------------------------------------------------------------------------- |
| `dev` / `sit` | `web/data/topics-{env}.json` + `web/data/tools-{env}.json`                                      |
| `prod`        | 上面两个 (`topics-prod.json` / `tools-prod.json`) **再加**无后缀的 `topics.json` + `tools.json` |

```bash
make export-dev      # APP_ENV=dev uv run python -m app.exporters
make export-sit
make export-prod     # 注意: 会覆盖 web/data/topics.json 与 tools.json (前端数据源)
```

也可以用 `POST /api/v1/export` (需要 API Key),返回条数与跳过统计。

- 无后缀的 `topics.json` / `tools.json` 是前端的数据源,只有 `prod` 才同步,dev/sit 刻意不碰
- 输出目录由 `EXPORT_OUTPUT_DIR` 决定 (默认 `../web/data`)
- 成员规则与排序以 `sql/schema.sql` 顶部的【导出投影】为准;字段形状见 `schema/topics.data.jsonc` 与 `schema/tools.data.jsonc` (带注释的格式定义,不是数据集)
- 产物是严格 JSON (UTF-8,2 空格缩进,结尾换行),写入用临时文件 + `os.replace`,不会留下半个文件
- 逐行跳过 (slug/tagline/url 为空,工具没有可用链接) 只记账不中断;枚举取值越界会直接让整次导出失败

## 鉴权

- 写操作 (`POST` / `PUT` / `DELETE`) 以及 `POST /api/v1/export` 需要请求头 `X-API-Key: <API_KEY>`,缺失或错误返回 401
- 读操作 (`GET`) 不需要鉴权
- `GET /api/v1/env` 目前**无鉴权**,只回 `env` / `debug` 两个非敏感字段;不要往里加任何配置值
- `sit` / `prod` 启动时校验 `API_KEY`:不能为空,不能等于默认的 `dev-secret-key`
- 密钥比较用 `secrets.compare_digest`;`.env.<env>` 已被 `.gitignore` 忽略,API Key 与库密码都只写在那里

```bash
curl -X POST http://127.0.0.1:8000/api/v1/export -H "X-API-Key: $API_KEY"
```

## 路由概览

12 个 path / 20 个 operation (与 `GET /openapi.json` 一致):

| 方法             | 路径                                              | 鉴权         | 说明                                                             |
| ---------------- | ------------------------------------------------- | ------------ | ---------------------------------------------------------------- |
| GET, POST        | `/api/v1/topics`                                  | 读 / 写      | 主题列表 (分页);新建主题                                         |
| GET, PUT, DELETE | `/api/v1/topics/{topic_id}`                       | 读 / 写 / 写 | 详情;更新;删除                                                   |
| GET              | `/api/v1/topics/{topic_id}/tools`                 | 读           | 该主题下的工具 (分页)                                            |
| GET              | `/api/v1/topics/{topic_id}/tool-count`            | 读           | 该主题下**会进导出**的工具数                                     |
| GET, POST        | `/api/v1/tools`                                   | 读 / 写      | 工具列表 (支持 `status` / `topic_id` / `featured` 过滤);新建工具 |
| GET, PUT, DELETE | `/api/v1/tools/{tool_id}`                         | 读 / 写 / 写 | 详情;更新;删除                                                   |
| GET, POST        | `/api/v1/tools/{tool_id}/links`                   | 读 / 写      | 链接列表;新增链接                                                |
| PUT, DELETE      | `/api/v1/tools/{tool_id}/links/{link_id}`         | 写 / 写      | 更新链接;删除链接                                                |
| PUT              | `/api/v1/tools/{tool_id}/topics`                  | 写           | 全量替换工具的主题归属 (没列进来的会被摘掉)                      |
| GET, POST        | `/api/v1/health`, `/api/v1/env`, `/api/v1/export` | - / - / 写   | 探活;当前环境;触发导出                                           |

约定:

- 分页响应带 `X-Total-Count`,响应带 `X-Request-ID` (客户端可传入 `X-Request-ID`,不合法会被换成服务端生成的)
- 列表项 `{tool_id}` / `{topic_id}` 用的是自增 `id`;**导出产物里的 `id` 是 `slug`**,两者不要混
- 库连不上,连接池取不到连接返回 503 (不是 500);唯一键冲突返回 409

## 测试

```bash
make test        # APP_ENV=dev uv run pytest -v
make test-cov    # 加覆盖率; pyproject 里 fail_under = 70
```

- 测试连**真数据库**:`tests/conftest.py` 每个用例前 `TRUNCATE` 四张 `xg_*` 表。必须指向一个可以随便清空的 dev/sit 库,不要指向有数据的库
- 跑测试前同样要先建表 (`make db-init`)
- 测试进程自动用 `NullPool` (见 `app/core/database.py`),避免 pytest-asyncio 每个用例换事件循环时报连接挂到别的 loop

## 常用命令

| 命令                                             | 作用                                                               |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `make sync`                                      | `uv sync` 安装/同步依赖                                            |
| `make db-init`                                   | 执行 `sql/schema.sql` 建表 (幂等)                                  |
| `make dev` / `sit` / `prod`                      | 按环境启动服务                                                     |
| `make format` / `lint` / `check`                 | ruff 格式化 / 检查 / 两项都跑                                      |
| `make test` / `test-cov`                         | 测试 (可带覆盖率)                                                  |
| `make export-dev` / `export-sit` / `export-prod` | 导出 JSON                                                          |
| `make clean`                                     | 清掉 `.ruff_cache` / `.pytest_cache` / `.coverage` / `__pycache__` |

## API 文档

启动后访问:

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## 文档同步点

改了下面这些地方,记得同步对应文件,否则文档会静默过期:

| 改了什么                                   | 要一起改                                         |
| ------------------------------------------ | ------------------------------------------------ |
| 路由 (新增 / 改名 / 删除接口)              | 本文件「路由概览」                               |
| `app/core/config.py` 的 `Settings` 字段    | `.env.example` 与本文件「环境变量」              |
| 导出产物命名或目录 (`config.export_paths`) | 本文件「导出产物」,`.env.example` 注释           |
| 表结构或导出投影 (`sql/schema.sql`)        | `schema/*.data.jsonc`,`app/models`,`app/schemas` |
| Makefile 目标                              | 本文件「快速开始」「常用命令」                   |

## 代码风格

```bash
make format      # ruff format (app/ tests/)
make lint        # ruff check
make check       # 两项都跑
```

规则配置在 `pyproject.toml` (line-length 120,`select` 里含 `S` bandit);注释与文档用中文,标点用半角 ASCII。
