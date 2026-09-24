---
description: 发布产品（status → 已发布）
---

# 发布产品

要发布的产品 ID: $ARGUMENTS

## 执行步骤

1. 如果用户未提供 ID，先列出待审核产品:

   ```
   !`python skills/tools/api.py products --status 1`
   ```

   请用户选择要发布的 ID。

2. 查看产品详情确认:

   ```
   !`python skills/tools/api.py product <ID>`
   ```

3. 发布产品:

   ```
   !`python skills/tools/api.py update-product <ID> --status 2`
   ```

4. 告知用户产品已发布，published_at 已自动记录
