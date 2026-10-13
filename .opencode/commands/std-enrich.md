---
description: AI 补全工具信息（描述、主题归属、标签、链接）
---

# 补全工具信息

要补全的工具 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 如果未提供 ID，列出草稿工具供用户选择:

   ```
   !`python skills/tools/api.py tools --status draft`
   ```

2. 查看工具详情:

   ```
   !`python skills/tools/api.py tool <工具ID>`
   ```

   注意: 主链接在 `links` 数组里，取 `is_primary=true` 的那条（`url` 字段）。标签在 `tags` 数组中，主题归属看 `topic_ids` / `primary_topic_id` 与 `topics` 数组。

3. 分析缺失字段，制定补全计划:
   - description 为空 → 根据工具名和 URL 生成一句话描述
   - `topic_ids` 为空 → 查询主题列表，判断最合适的主题
   - tags 为空 → 生成 2-3 个标签
   - links 为空或缺少附加链接 → 根据工具名搜索官网，添加链接

4. 查询现有主题:

   ```
   !`python skills/tools/api.py topics`
   ```

5. 逐项补全:
   a. 更新描述与主题归属（只传需要更新的字段）:

   ```
   !`python skills/tools/api.py --yes update-tool <工具ID> --description "描述内容" --topic-ids <主题ID> --primary-topic-id <主题ID>`
   ```

   b. 设置标签（`set-tags` 是全量替换）。执行前必须先读现有标签:

   ```
   !`python skills/tools/api.py tool-tags <工具ID>`
   ```

   传入包含**现有标签 + 新标签**的完整列表:

   ```
   !`python skills/tools/api.py --yes set-tags <工具ID> --tags "现有,新增"
   ```

   标签没有独立实体，不需要先"创建标签"，直接写进列表即可。

   c. 添加链接。先检查 links 数组是否已有相同 URL，避免重复添加:

   ```
   !`python skills/tools/api.py add-link <工具ID> --url "https://..." --primary --label website
   ```

   附加链接（文档/仓库等）用 `--label docs|github|api` 且不加 `--primary`。

6. 展示补全后的工具信息
7. 告知用户可用 `/std-review` 提交审核
