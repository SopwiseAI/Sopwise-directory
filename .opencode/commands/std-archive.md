---
description: 下架或重新发布工具（已发布 ↔ 已下架）
---

# 下架 / 重新发布

要操作的工具 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 执行步骤

1. 如果未提供 ID，列出已发布和已下架工具供用户选择:

   ```
   !`python skills/tools/api.py tools --status published`
   !`python skills/tools/api.py tools --status archived`
   ```

   如果两者均为空，告知用户"暂无已发布/已下架工具，下架操作需先有已发布工具"，建议 `/std-publish`。

2. 查看工具详情确认当前状态:

   ```
   !`python skills/tools/api.py tool <工具ID>`
   ```

3. 根据返回数据的 `status` 字段决定操作路径:

   - **status=published (已发布)** → 下架 (published→archived):

     ```
     !`python skills/tools/api.py --yes update-tool <工具ID> --status archived`
     ```

   - **status=archived (已下架)** → 重新发布 (archived→published):

     ```
     !`python skills/tools/api.py --yes update-tool <工具ID> --status published`
     ```

   - **status=draft 或 pending** → 告知用户该工具尚未发布，建议使用 `/std-publish`

4. 告知用户操作已完成
