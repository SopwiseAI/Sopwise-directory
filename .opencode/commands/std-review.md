---
description: 审核待审核工具，AI 辅助判断是否通过
---

# 审核工具

审核目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

审核 status=pending（待审核）的工具，决定通过（→published）或打回（→draft）。

判定标准**一律**以 `skills/prompts/tool-review.md` 为准（**必须先读**），本文件不重复条目表。
其中「必须有 `is_primary=true` 的主链接」是必要项: 只看到 links 里有 `status=active` 就放过会误判通过。

**未指定审核目标时（`$ARGUMENTS` 为空），只列出待审核清单让用户选择，不要写库。**

## 执行步骤

1. 拉取待审核工具列表（用于定位 `$ARGUMENTS` 指定的工具，或未指定时供用户选择）:

   ```
   !`python skills/tools/api.py tools --status pending --page-size 100`
   ```

2. 如果没有待审核工具，告知用户"暂无待审核工具"并结束

3. 对每个待审核工具:
   a. 查看工具详情:

   ```
   python skills/tools/api.py tool <工具ID>
   ```

   b. 按 `skills/prompts/tool-review.md` 逐项判定（必要项缺一即打回）

   c. 给出审核意见: 通过 / 打回（附具体原因）

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
