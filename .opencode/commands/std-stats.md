---
description: 目录总览统计
---

# 目录总览

## 执行步骤

1. 先确认 studio 可用:

   ```
   !`python skills/tools/api.py health`
   ```

2. 执行统计:

   ```
   !`python skills/tools/api.py stats`
   ```

3. 根据统计结果给出简要分析:
   - 待审核 > 0 → 提示 `/std-review`
   - 草稿 > 0 → 提示 `/std-enrich`
   - 已发布 = 0 → 提示需先发布才能导出
