---
description: 审核待审核产品，AI 辅助判断是否通过
---

# 审核产品

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

审核 status=1（待审核）的产品，决定通过（→已发布）或打回（→草稿）。
审核标准参见 `skills/prompts/product-review.md`。

## 执行步骤

1. 拉取待审核产品列表:

   ```
   !`python skills/tools/api.py products --status 1`
   ```

2. 如果没有待审核产品，告知用户"暂无待审核产品"并结束

3. 对每个待审核产品:
   a. 查看产品详情:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

   b. 逐项检查必要项（缺一项即打回）:
   - **名称**: 非空，无拼写错误
   - **链接**: links 数组至少有一条记录
   - **slug**: 与名称对应且 URL 友好

   c. 检查建议项（不满足可通过但提示）:
   - **分类**: category_id 非空
   - **定价**: pricing 为 free/freemium/paid/opensource 之一
   - **描述**: description 非空
   - **标签**: tags 非空且与产品特征贴切

   d. 给出审核意见: 通过 / 打回（附具体原因）

4. 询问用户确认审核结果

5. 对通过的产品发布（1→2 合法）:

   ```
   !`python skills/tools/api.py --yes update-product <产品ID> --status 2`
   ```

6. 对打回的产品退回草稿（1→0 合法）:

   ```
   !`python skills/tools/api.py --yes update-product <产品ID> --status 0`
   ```

7. 汇总审核结果（通过 N 个，打回 M 个）
