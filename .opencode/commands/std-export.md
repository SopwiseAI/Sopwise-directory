---
description: 导出 JSON 数据到 web/data/data.json
---

# 导出数据

## 执行步骤

1. 确认 studio 服务已启动

2. 执行导出:

   ```
   !`python skills/tools/api.py export`
   ```

3. 告知用户:
   - 导出的分类数和产品数
   - 文件路径: web/data/data.json
   - 下一步: 提交代码并部署到 Vercel 即可更新前端
