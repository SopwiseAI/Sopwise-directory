---
description: 发布产品（status → 已发布，自动处理状态转换）
---

# 发布产品

要发布的产品 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 如果用户未提供 ID，先列出待审核产品:

   ```
   !`python skills/tools/api.py products --status 1`
   ```

   请用户选择要发布的 ID。

2. 查看产品详情确认当前状态:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

3. 根据返回数据的 `status` 字段决定操作路径:

   - **status=1 (待审核)** → 检查必要项后直接发布:
     先确认名称非空、links 数组非空，然后:

     ```
     !`python skills/tools/api.py --yes update-product <产品ID> --status 2`
     ```

   - **status=0 (草稿)** → 需两步，先提交审核再发布:
     先检查必要项（名称、链接），缺则告知用户先用 `/std-enrich` 补全:

     ```
     !`python skills/tools/api.py --yes update-product <产品ID> --status 1`
     !`python skills/tools/api.py --yes update-product <产品ID> --status 2`
     ```

   - **status=3 (已下架)** → 直接重新发布 (3→2 合法):

     ```
     !`python skills/tools/api.py --yes update-product <产品ID> --status 2`
     ```

   - **status=2 (已发布)** → 告知用户该产品已是发布状态，无需操作

4. 告知用户产品已发布，published_at 已自动记录
