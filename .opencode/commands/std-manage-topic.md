---
description: 主题管理（查看/改名/改 slug/改图标/禁用/删除）
---

# 主题管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

对主题执行 CRUD 闭环管理: 列表（带工具数）、查看详情、更新字段、禁用、删除。

## 执行步骤

1. 解析用户输入:
   - 无参数 → 进入列表模式
   - 数字 ID → 查看该主题详情并提供操作菜单
   - 非数字 → 理解为主题名，先查列表定位 ID

### 列表模式

2. 拉取全部主题:

   ```
   !`python skills/tools/api.py topics --json`
   ```

3. 主题下工具数已随列表返回（`tool_count` 字段），无需逐个再查；如需单独确认:

   ```
   !`python skills/tools/api.py topic-count <主题ID>`
   ```

   注意: topic-count 仅统计 status=published 且存在 active 链接的工具（导出口径），未发布工具不计入；`topic-tools` 则列出全部状态的工具。

4. 输出表格: ID / 名称 / Slug / 图标 / 已发布工具数 / 状态。告知用户可指定 ID 进一步操作。

### 详情模式

5. 查看主题详情:

   ```
   !`python skills/tools/api.py topic <主题ID>`
   ```

6. 根据用户意图执行对应操作:

   **改名 / 改 slug / 改图标 / 改排序**:

   ```
   !`python skills/tools/api.py --yes update-topic <主题ID> --name "新名"`
   ```

   仅传需改的字段，可选: `--name` `--slug` `--icon` `--description` `--sort-order` `--status`

   - `--status active`: 启用（参与导航与导出）
   - `--status disabled`: 禁用（保留工具归属但不导出）

   slug 修改须遵守统一 slug 规范（见末尾）。

   **删除主题**:

   注意: topic-count 只统计已发布工具，但后端删除拦截统计**所有状态**的归属关系。即 count=0 不代表可删，仍可能有草稿/待审核工具挂在该主题下。先查 count，再参考 stats 确认无关联后删除:

   ```
   !`python skills/tools/api.py topic-count <主题ID>`
   ```

   - 后端拒绝（HTTP 409: Topic has N tools）→ 告知用户"该主题下有 N 个工具（含未发布），请先迁移或删除这些工具，或改用 disabled 而非删除"
   - 后端放行 → 删除成功，告知用户

7. 告知用户操作结果

## slug 规范（创建/修改主题共用）

- 英文名: 转小写，空格转连字符 (如 "Code Tools" → "code-tools")
- 中文名: 用拼音或英文翻译 (如 "对话助手" → "chat-assistant")
- 只能含小写字母、数字、连字符
- 重复检测: 修改前查现有主题，name 和 slug 均不可与已有重复
