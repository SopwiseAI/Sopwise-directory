---
description: 列出产品，支持按状态过滤
---

# 列出产品

过滤条件: $ARGUMENTS

## 执行步骤

根据用户输入判断过滤条件:

- "草稿" 或 "draft" → --status 0
- "待审核" 或 "pending" → --status 1
- "已发布" 或 "published" → --status 2
- "已下架" 或 "archived" → --status 3
- 无参数 → 列出全部

执行:

```
!`python skills/tools/api.py products --status <N>`
```

如果用户要查看某个产品详情，告知使用 `python skills/tools/api.py product <ID>`。
