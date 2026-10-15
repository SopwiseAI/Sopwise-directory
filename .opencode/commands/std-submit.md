---
description: 提交工具审核（草稿 → 待审核）
---

# 提交审核

要提交的工具 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 执行步骤

1. 如果未提供 ID，列出草稿工具供用户选择:

   ```
   !`python skills/tools/api.py tools --status draft`
   ```

2. 查看工具详情，确认必要项齐全:

   ```
   python skills/tools/api.py tool <工具ID>
   ```

3. 必填校验（缺一项即拦截，不调 update-tool）:
   - **name** 非空
   - **tagline** 非空且以标点结尾
   - **links** 数组至少 1 条
     缺失时告知用户先用 `/std-enrich` 补全后再提交，不要把缺数据的工具推进待审核

4. 提交审核 (draft→pending):

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --status pending
   ```

5. 告知用户工具已提交审核，可用 `/std-review` 审核或 `/std-publish` 直接发布
