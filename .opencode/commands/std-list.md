---
description: 列出产品，支持按状态过滤和搜索
---

# 列出产品

过滤条件: $ARGUMENTS

## 执行步骤

1. 根据用户输入判断 status 过滤:
   - "草稿" 或 "draft" → 0
   - "待审核" 或 "pending" → 1
   - "已发布" 或 "published" → 2
   - "已下架" 或 "archived" → 3
   - 无参数 → 不加 --status，列出全部

2. 如果用户提供了搜索关键词（非状态关键词），使用 --search:

   ```
   !`python skills/tools/api.py products --search "关键词"`
   ```

3. status 过滤和搜索可组合:

   ```
   !`python skills/tools/api.py products --status 2 --search "chat"`
   ```

4. 如果输出底部显示"共 N 条"且 N 大于当前显示数量，告知用户可翻页:
   - 下一页: `python skills/tools/api.py products --page 2`
   - 每页条数: `--page-size 50`

5. 如果用户要查看某个产品详情，告知使用:
   ```
   python skills/tools/api.py product <产品ID>
   ```
