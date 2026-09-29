# Studio

Sopwise Directory 数据管理后端，基于 FastAPI + SQLAlchemy 2.0 (async) + MySQL。

## 环境要求

- Python >= 3.11
- uv (包管理器)
- MySQL 5.7+

## 数据流

```
MySQL ← Studio (CRUD)
         ↓
    export → web/data/data.json → Vercel 部署
```

## 快速开始

```bash
# 安装依赖
make sync
# 或: uv sync

# 启动服务（按环境）
make dev     # 开发，--reload
make sit     # SIT
make prod    # 生产
```

## 环境配置

| 环境 | 配置文件    | APP_ENV | 启动命令    |
| ---- | ----------- | ------- | ----------- |
| 开发 | `.env.dev`  | `dev`   | `make dev`  |
| 测试 | `.env.sit`  | `sit`   | `make sit`  |
| 生产 | `.env.prod` | `prod`  | `make prod` |

通过 `APP_ENV` 环境变量决定加载哪个 `.env` 文件。

## 常用命令

```bash
make format      # ruff 格式化
make lint        # ruff 检查
make check       # lint + 格式检查
make test        # 运行测试
make test-cov    # 测试 + 覆盖率
make export-dev  # 导出 JSON 到 web/data/data.json
make clean       # 清理缓存
```

## API 文档

启动后访问：

- Swagger UI: <http://localhost:8000/docs>
- ReDoc: <http://localhost:8000/redoc>

## 代码风格

```bash
# 格式化
make format

# 检查
make lint

# 两项都跑
make check
```
