---
description: 导出 JSON 数据到 web 目录
---

# 导出数据

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 执行步骤

1. 执行导出:

   ```
   !`python skills/tools/api.py export`
   ```

   API Key 由 CLI 自动探测（调后端 `/api/v1/env` 获取环境，读 `studio/.env.{env}` 的 `API_KEY`）。除非显式设置了 `STUDIO_API_KEY` 环境变量，否则无需手动配置。

2. 从导出响应中提取实际信息告知用户:
   - 导出的分类数 (`categories_count`)
   - 导出的产品数 (`products_count`)
   - 环境副本路径 (`output_path`，形如 `data-{env}.json`，已被 .gitignore 忽略)
   - 当前环境 (`app_env`)
   - 前端同步状态 (`synced_frontend`):
     - **dev/sit**: `false` — 仅写环境副本，**未改动 data.json**（保护生产数据源）
       - 本地测前端: `cp web/data/data-dev.json web/data/data.json`（勿提交）
     - **prod**: `true` — 已同步 `web/data/data.json`
       - 下一步: 提交 `web/data/data.json` 到 main 分支并部署到 Vercel

## 安全说明

- `data.json` 是生产数据源，仅 prod 环境导出才同步
- 非 main 分支提交 `data.json` 会被 pre-commit hook 拦截
- dev/sit 导出只写 `data-{env}.json` 环境副本（gitignore 忽略）
