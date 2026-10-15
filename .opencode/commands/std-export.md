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
   python skills/tools/api.py export
   ```

   API Key 由 CLI 自动探测，优先级 `API_KEY` > `STUDIO_API_KEY` > 探测后端（调 `/api/v1/env` 获取环境，读 `studio/.env.{env}` 的 `API_KEY`）。前三者任一可用即可，无需手动配置。

   注意: `export` 不走 `_write`，因此**不支持** `--dry-run` / `--op-id`（传了会被静默忽略，仍然写盘）；它也**不触发** prod 环境保护的 `--yes` 门槛。

2. 从导出响应中提取实际信息告知用户:
   - 导出的主题数 (`topics_count`)
   - 导出的工具数 (`tools_count`)
   - 产物文件名 (`output_path`，形如 `topics-{env}.json, tools-{env}.json`；**只回文件名，不回服务端绝对路径**，已被 .gitignore 忽略)
   - 当前环境 (`app_env`)
   - 跳过统计 (`skipped_count` / `skipped_reasons`): 被跳过的行数与每类原因各多少，用于判断这次导出是否干净
   - 前端同步状态 (`synced_frontend`):
     - **dev/sit**: `false` — 仅写带环境后缀的两个副本，**未改动 topics.json / tools.json**（保护生产数据源）
       - 本地测前端时把两份文件都拷过去: `cp web/data/topics-dev.json web/data/topics.json && cp web/data/tools-dev.json web/data/tools.json`
     - **prod**: `true` — 已同步 `web/data/topics.json` 与 `web/data/tools.json`
       - 下一步: 提交这两个文件到 main 分支并部署到 Vercel

## 安全说明

- `topics.json` 与 `tools.json` 是生产数据源，仅 prod 环境导出才同步
- 只有 `main` 与 `data/*` 分支允许提交这两个文件；其他分支会被 `.husky/pre-commit` 拦截
- dev/sit 导出只写 `topics-{env}.json` / `tools-{env}.json` 环境副本（gitignore 忽略）
