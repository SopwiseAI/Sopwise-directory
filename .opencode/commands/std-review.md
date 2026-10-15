---
description: 审核待审核工具，AI 辅助判断是否通过
---

# 审核工具

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

审核 status=pending（待审核）的工具，决定通过（→published）或打回（→draft）。
审核标准参见 `skills/prompts/tool-review.md`。

## 执行步骤

1. 拉取待审核工具列表:

   ```
   !`python skills/tools/api.py tools --status pending`
   ```

2. 如果没有待审核工具，告知用户"暂无待审核工具"并结束

3. 对每个待审核工具:
   a. 查看工具详情:

   ```
   python skills/tools/api.py tool <工具ID>
   ```

   b. 逐项检查必要项（缺一项即打回）:
   - **名称**: 非空，无拼写错误
   - **tagline**: 非空且以标点结尾
   - **链接**: links 数组至少有一条 status=active 的记录
   - **slug**: 与名称对应且 URL 友好

   c. 检查建议项（不满足可通过但提示）:
   - **主题**: topic_ids 非空，且已设置主主题 primary_topic_id
   - **定价**: pricing 为 free/freemium/paid 之一
   - **地域/访问**: origin 为 cn/overseas，access 为 direct/proxy
   - **语言**: languages 非空（1~8 项，ISO 639-1）
   - **描述**: description 非空
   - **标签**: tags 非空且与工具特征贴切

   d. 给出审核意见: 通过 / 打回（附具体原因）

4. 询问用户确认审核结果

5. 对通过的工具发布（pending→published 合法）:

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --status published
   ```

6. 对打回的工具退回草稿（pending→draft 合法）:

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --status draft
   ```

7. 汇总审核结果（通过 N 个，打回 M 个）
