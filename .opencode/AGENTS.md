# Sopwise Directory — AI Agent 规则

## 项目概述

AI 驱动的目录站，包含三个模块:

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
| POST           | /api/v1/export                        | 导出 JSON (需 API Key) |
| GET            | /api/v1/health                        | 健康检查               |

## 关键约定

- 数据库表前缀 `sd_`，主键 BIGINT 自增，业务标识用 slug
- URL 去重通过归一化 + SHA-256 hash
- is_primary 唯一性由应用层保证
- 环境配置: `.env.dev` / `.env.sit` / `.env.prod`，通过 `APP_ENV` 切换
