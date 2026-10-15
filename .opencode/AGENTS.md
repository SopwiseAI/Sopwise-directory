# XiGee Directory — AI Agent 规则

## 项目概述

AI 驱动的目录站 (XiGee), 包含三个模块:

- `web/` — Next.js 前端, 展示数据 (Vercel 部署)
- `studio/` — FastAPI 后端, 管理数据 (uv + Python 3.13)
- `skills/` — AI 套件, 驱动数据管理流程

## 数据流

```
数据库 ← studio (FastAPI CRUD)
         ↓
    studio 导出 JSON → web/data/topics-{env}.json + tools-{env}.json
                       prod 额外同步 topics.json + tools.json
         │
         └─ ⚠️ 前端【目前仍读 web/data/data.json】, 还没切到 topics/tools
            (缺口与字段映射见 web/AGENTS.md 的「数据源迁移」一节)
         ↑
    skills/tools/api.py 调用 studio API
    .opencode/commands/ 触发 AI 工作流
```

## 工具状态流程

```
draft=草稿 → pending=待审核 → published=已发布 → archived=已下架
```

- 仅 status=published 且存在 status=active 链接的工具进导出产物
- published_at 仅在首次 status→published 时写入
- 合法状态转换: draft→pending, pending→draft, pending→published, published→archived, archived→published
- 非法状态迁移后端返回 409 (不是 400)
- 主题 (topic) 状态: active / disabled; 链接 (link) 状态: active / broken / disabled

## 开发命令

```bash
# 启动服务
./scripts/dev.sh                # 前端 + 后端
./scripts/dev-web.sh            # 仅前端 (port 3000, 前端没有配置文件)
./scripts/dev-studio.sh         # 仅后端 (端口取 .env.<APP_ENV> 的 APP_PORT, 缺省 8000)
./scripts/stop.sh               # 停止服务
./scripts/status.sh             # 查看状态

# 数据管理 (通过 skills/tools/api.py)
python skills/tools/api.py stats                        # 目录统计
python skills/tools/api.py tools --status pending       # 待审核工具
python skills/tools/api.py export                       # 导出 JSON

# 后端检查与测试
cd studio && make check                                 # ruff + mypy + 格式校验
cd studio && make test ALLOW_SHARED_DB=1                # 默认 dev 是共享库: 直接 uv run pytest 会被门禁以退出码 3 拦住
```

## Studio API 端点

| 方法           | 路径                                    | 说明                        |
| -------------- | --------------------------------------- | --------------------------- |
| GET/POST       | /api/v1/topics                          | 主题 CRUD                   |
| GET/PUT/DELETE | /api/v1/topics/{topic_id}               | 主题详情                    |
| GET            | /api/v1/topics/{topic_id}/tools         | 主题下工具                  |
| GET            | /api/v1/topics/{topic_id}/tool-count    | 主题下已发布工具数          |
| GET/POST       | /api/v1/tools                           | 工具 CRUD                   |
| GET/PUT/DELETE | /api/v1/tools/{tool_id}                 | 工具详情                    |
| GET/POST       | /api/v1/tools/{tool_id}/links           | 工具链接                    |
| PUT/DELETE     | /api/v1/tools/{tool_id}/links/{link_id} | 链接详情                    |
| PUT            | /api/v1/tools/{tool_id}/topics          | 工具主题归属 (替代旧 /tags) |
| GET            | /api/v1/env                             | 环境信息                    |
| POST           | /api/v1/export                          | 导出 JSON (需 API Key)      |
| GET            | /api/v1/health                          | 健康检查                    |

写操作需要 `X-API-Key` 头。

## 关键约定

- 数据库表前缀 `xg_`, 主键 BIGINT 自增, 业务标识用 slug
- 主要表: `xg_topic` `xg_tool` `xg_tool_topic` `xg_tool_link`
- 标签是 `xg_tool.tags` JSON 列 (字符串数组, 最多 8 个), 不是独立表, 也没有 `/tags` 端点
- 工具 status 是字符串: draft / pending / published / archived
- 主题 status: disabled / active; 链接 status: active / broken / disabled
- pricing: free / freemium / paid; 是否开源是独立字段 `is_open_source`
- 新增必填字段: `tagline` / `origin`(cn|overseas) / `access`(direct|proxy) / `languages`(ISO 639-1 数组, 1~8 项)
- 工具的主题归属用 `topic_ids: [int]` + 可选 `primary_topic_id`
- URL 去重通过归一化 + SHA-256 hash
- is_primary 唯一性由应用层保证
- 环境配置: `.env.dev` / `.env.sit` / `.env.prod`, 通过 `APP_ENV` 切换

## MySQL MCP 使用规则

三个 MCP server 对应三套环境, 按用户意图选用:

| MCP server   | 环境 | 权限                                                |
| ------------ | ---- | --------------------------------------------------- |
| `mysql-dev`  | dev  | 读写 (`MYSQL_ALLOW_WRITE=true`, 见 `opencode.json`) |
| `mysql-sit`  | sit  | 只读                                                |
| `mysql-prod` | prod | 只读                                                |

- 用户说"开发库/测试库/生产库"时, 对应使用 `mysql-dev` / `mysql-sit` / `mysql-prod`
- prod 默认只读; 如需写操作, 需用户显式确认后修改 `opencode.json` 加 `MYSQL_ALLOW_WRITE`
- 表名前缀 `xg_`, 主要表: `xg_topic` `xg_tool` `xg_tool_topic` `xg_tool_link`
- 工具 status: draft=草稿 pending=待审核 published=已发布 archived=已下架; 合法转换: draft→pending, pending→draft, pending→published, published→archived, archived→published
- 标签在 `xg_tool.tags` JSON 列里, 没有 `xg_tag` / `xg_product_tag` 这类表

## 生产环境保护

执行 skills/tools/api.py 写操作时, CLI 会探测后端 `/api/v1/env`, 若返回 `prod` 则强制门槛
(注意: `STUDIO_URL` 指向 localhost/127.0.0.1/0.0.0.0 时**跳过探测** —— 本地以 `APP_ENV=prod`
起的 studio 不受下面这三条保护):

- 所有写操作必须 `--yes`, 否则拒绝 (exit 3)
- DELETE 操作额外必须 `--prod-confirm`, 否则拒绝 (exit 3)
- 日志醒目记录 `PROD 写操作`

模型在 prod 环境执行任何命令前应:

1. 先确认操作必要性, 优先 dry-run 预览
2. 写操作统一带 `--yes`, 删除类带 `--prod-confirm`
3. 状态变更 (尤其下架/打回) 需用户明确指令, 不可自主执行
