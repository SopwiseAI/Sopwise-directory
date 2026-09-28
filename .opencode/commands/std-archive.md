---
description: 下架或重新发布产品（已发布 ↔ 已下架）
---

# 下架 / 重新发布

要操作的产品 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 执行步骤

1. 如果未提供 ID，列出已发布和已下架产品供用户选择:

   ```
   !`python skills/tools/api.py products --status 2`
   !`python skills/tools/api.py products --status 3`
   ```

   如果两者均为空，告知用户"暂无已发布/已下架产品，下架操作需先有已发布产品"，建议 `/std-publish`。

2. 查看产品详情确认当前状态:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

3. 根据返回数据的 `status` 字段决定操作路径:

   - **status=2 (已发布)** → 下架 (2→3):

     ```
     !`python skills/tools/api.py --yes update-product <产品ID> --status 3`
     ```

   - **status=3 (已下架)** → 重新发布 (3→2):

     ```
     !`python skills/tools/api.py --yes update-product <产品ID> --status 2`
     ```

   - **status=0 或 1** → 告知用户该产品尚未发布，建议使用 `/std-publish`

4. 告知用户操作已完成
