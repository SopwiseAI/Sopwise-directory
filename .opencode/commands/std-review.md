---
description: 审核待审核产品，AI 辅助判断是否通过
---

# 审核产品

## 你的任务

审核 status=1（待审核）的产品，决定通过（→已发布）或打回（→草稿）。

## 执行步骤

1. 拉取待审核产品列表:

   ```
   !`python skills/tools/api.py products --status 1`
   ```

2. 如果没有待审核产品，告知用户"暂无待审核产品"

3. 对每个待审核产品:
   a. 查看产品详情:

   ```
   !`python skills/tools/api.py product <ID>`
   ```

   b. 检查以下审核标准:
   - 产品名称是否完整、准确
   - 是否有至少一个链接（主链接）
   - 是否有描述（可选，允许为空）
   - 是否归属了分类
   - pricing 是否合理
     c. 给出审核意见: 通过 / 打回（附原因）

4. 询问用户确认审核结果

5. 对通过的产品发布:

   ```
   !`python skills/tools/api.py update-product <ID> --status 2`
   ```

6. 对打回的产品退回草稿:

   ```
   !`python skills/tools/api.py update-product <ID> --status 0`
   ```

7. 汇总审核结果
