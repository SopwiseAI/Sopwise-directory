---
description: 提交产品审核（草稿 → 待审核）
---

# 提交审核

要提交的产品 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 执行步骤

1. 如果未提供 ID，列出草稿产品供用户选择:

   ```
   !`python skills/tools/api.py products --status 0`
   ```

2. 查看产品详情，确认名称和链接非空:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

3. 如果缺少名称或链接，告知用户先用 `/std-enrich` 补全后再提交

4. 提交审核 (0→1):

   ```
   !`python skills/tools/api.py --yes update-product <产品ID> --status 1`
   ```

5. 告知用户产品已提交审核，可用 `/std-review` 审核或 `/std-publish` 直接发布
