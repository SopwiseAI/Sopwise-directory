# Studio

Sopwise Directory 数据管理后端，基于 FastAPI + SQLAlchemy 2.0 (async) + MySQL。

## 环境要求

- Python >= 3.13
- uv (包管理器)
- MySQL 8.0+

## 快速开始

```bash
# 安装依赖
uv sync

# 开发环境启动
APP_ENV=dev uv run uvicorn app.main:app --reload

# SIT 环境
APP_ENV=sit uv run uvicorn app.main:app

# 生产环境
APP_ENV=prod uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## 环境配置

| 环境 | 配置文件    | APP_ENV |
| ---- | ----------- | ------- |
| 开发 | `.env.dev`  | `dev`   |
| 测试 | `.env.sit`  | `sit`   |
| 生产 | `.env.prod` | `prod`  |

通过 `APP_ENV` 环境变量决定加载哪个 `.env` 文件。

## API 文档

启动后访问：

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## 核心端点

| 方法 | 路径             | 说明                            |
| ---- | ---------------- | ------------------------------- |
| GET  | `/api/v1/health` | 健康检查                        |
| GET  | `/api/v1/env`    | 环境信息                        |
| POST | `/api/v1/export` | 导出 JSON 到 web/data/data.json |

## 数据库迁移

```bash
# 生成迁移脚本
uv run alembic revision --autogenerate -m "description"

# 执行迁移
uv run alembic upgrade head

# 回滚
uv run alembic downgrade -1
```

## 代码风格

```bash
# 格式化
uv run ruff format .

# 检查
uv run ruff check .
```
