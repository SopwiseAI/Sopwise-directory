---
description: 导出 JSON 数据到 web 目录
---

# 导出数据

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## API Key 设置

导出需要 API Key。如果 `STUDIO_API_KEY` 未设置，告知用户:

```bash
export STUDIO_API_KEY=你的密钥
```

## 执行步骤

1. 执行导出（需要 API Key）:

   ```
   !`python skills/tools/api.py export`
   ```

2. 从导出响应中提取实际信息告知用户:
   - 导出的分类数 (`categories_count`)
   - 导出的产品数 (`products_count`)
   - 环境副本路径 (`output_path`，形如 `data-{env}.json`，已被 .gitignore 忽略)
   - 当前环境 (`app_env`)
   - 前端数据源 `web/data/data.json` 已同步更新（导出同时写两份）
   - 下一步: 提交 `web/data/data.json` 并部署到 Vercel 即可更新前端
