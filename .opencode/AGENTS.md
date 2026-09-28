# XiGee Directory — AI Agent 规则

## 项目概述

AI 驱动的目录站 (XiGee)，包含三个模块:

- `web/` — Next.js 前端，展示数据 (Vercel 部署)
- `studio/` — FastAPI 后端，管理数据 (uv + Python 3.13)
- `skills/` — AI 套件，驱动数据管理流程

## 数据流

```
数据库 ← studio (FastAPI CRUD)
         ↓
    studio 导出 JSON → web/data/data.json → Vercel 部署
         ↑
    skills/tools/api.py 调用 studio API
    .opencode/commands/ 触发 AI 工作流
```

## 产品状态流程

```
0=草稿 → 1=待审核 → 2=已发布 → 3=已下架
```

- 仅 status=2 的产品导出到前端
- published_at 仅在首次 status→2 时写入
- 合法状态转换: 0→1, 1→0, 1→2, 2→3, 3→2

## 开发命令

```bash
# 启动服务
./scripts/dev.sh                # 前端 + 后端
./scripts/dev-web.sh            # 仅前端 (port 3000)
./scripts/dev-studio.sh         # 仅后端 (port 8000)
./scripts/stop.sh               # 停止服务
./scripts/status.sh             # 查看状态

# 数据管理 (通过 skills/tools/api.py)
python skills/tools/api.py stats                        # 目录统计
python skills/tools/api.py products --status 1          # 待审核产品
python skills/tools/api.py export                       # 导出 JSON

# 后端测试
cd studio && APP_ENV=dev uv run pytest -v
cd studio && uv run ruff check . && uv run ruff format .
```

## Studio API 端点

| 方法           | 路径                                  | 说明                   |
| -------------- | ------------------------------------- | ---------------------- |
| GET/POST       | /api/v1/categories                    | 分类 CRUD              |
| GET/PUT/DELETE | /api/v1/categories/{id}               | 分类详情               |
| GET/POST       | /api/v1/products                      | 产品 CRUD              |
| GET/PUT/DELETE | /api/v1/products/{id}                 | 产品详情               |
| GET/POST       | /api/v1/products/{id}/links           | 产品链接               |
| PUT/DELETE     | /api/v1/products/{id}/links/{link_id} | 链接详情               |
| PUT            | /api/v1/products/{id}/tags            | 产品标签               |
| GET/POST       | /api/v1/tags                          | 标签 CRUD              |
| GET            | /api/v1/tags/{id}                     | 标签详情               |
| PUT            | /api/v1/tags/{id}                     | 更新标签               |
| DELETE         | /api/v1/tags/{id}                     | 删除标签               |
| GET            | /api/v1/tags/{id}/count               | 标签关联产品数         |
| GET            | /api/v1/categories/{id}/count         | 分类下已发布产品数     |
| GET            | /api/v1/env                           | 环境信息               |
| POST           | /api/v1/export                        | 导出 JSON (需 API Key) |
| GET            | /api/v1/health                        | 健康检查               |

## 关键约定

- 数据库表前缀 `sd_`，主键 BIGINT 自增，业务标识用 slug
- URL 去重通过归一化 + SHA-256 hash
- is_primary 唯一性由应用层保证
- 环境配置: `.env.dev` / `.env.sit` / `.env.prod`，通过 `APP_ENV` 切换

## MySQL MCP 使用规则

三个 MCP server 对应三套环境，按用户意图选用:

| MCP server   | 环境 | 权限 |
| ------------ | ---- | ---- |
| `mysql-dev`  | dev  | 读写 |
| `mysql-sit`  | sit  | 读写 |
| `mysql-prod` | prod | 只读 |

- 用户说"开发库/测试库/生产库"时，对应使用 `mysql-dev` / `mysql-sit` / `mysql-prod`
- prod 默认只读；如需写操作，需用户显式确认后修改 `opencode.json` 加 `MYSQL_ALLOW_WRITE`
- 表名前缀 `sd_`，主要表: `sd_product` `sd_category` `sd_tag` `sd_product_link` `sd_product_tag`
- 产品 status: 0=草稿 1=待审核 2=已发布 3=已下架; 合法转换: 0→1, 1→0, 1→2, 2→3, 3→2

## 生产环境保护

执行 skills/tools/api.py 写操作时，CLI 自动探测后端 `/api/v1/env`，若返回 `prod` 则强制门槛:

- 所有写操作必须 `--yes`，否则拒绝 (exit 3)
- DELETE 操作额外必须 `--prod-confirm`，否则拒绝 (exit 3)
- 日志醒目记录 `PROD 写操作`

模型在 prod 环境执行任何命令前应:

1. 先确认操作必要性，优先 dry-run 预览
2. 写操作统一带 `--yes`，删除类带 `--prod-confirm`
3. 状态变更（尤其下架/打回）需用户明确指令，不可自主执行
