---
description: 列出工具，支持按状态过滤和搜索
---

# 列出工具

过滤条件: $ARGUMENTS

## 执行步骤

1. 根据用户输入判断过滤条件:

   **按状态**:
   - "草稿" 或 "draft" → `--status draft`
   - "待审核" 或 "pending" → `--status pending`
   - "已发布" 或 "published" → `--status published`
   - "已下架" 或 "archived" → `--status archived`
   - 无状态参数 → 不加 `--status`，列出全部

   **按主题**: 用户提供主题名或 ID → 先查主题列表定位 ID，加 `--topic-id <ID>`

   **按精选**: 用户提到"精选"/"推荐" → 加 `--featured`

   多维过滤可组合:

   ```
   !`python skills/tools/api.py tools --status published --topic-id 3 --featured`
   ```

2. 如果用户提供了搜索关键词（非过滤关键词），使用 --search:

   ```
   !`python skills/tools/api.py tools --search "关键词"`
   ```

   注意: 后端 `/tools` 不支持 search 参数，CLI 拉取全量后按 name/slug/tagline/tags 做客户端过滤；此模式下不显示"共 N 条"（该行仅在后端分页计数时出现）。

3. status + search + 其他过滤可组合:

   ```
   !`python skills/tools/api.py tools --status published --search "chat" --featured`
   ```

4. 如果输出底部显示"共 N 条"且 N 大于当前显示数量，告知用户可翻页:
   - 下一页: `python skills/tools/api.py tools --page 2`
   - 每页条数: `--page-size 50`

5. 如果结果为空，告知用户:
   - 该状态无工具 → 提示 `/std-collect` 采集或 `/std-add-tool` 添加
   - 搜索无匹配 → 建议换关键词或 `/std-list` 查全量

6. 如果用户要查看某个工具详情，告知使用:

   ```
   python skills/tools/api.py tool <工具ID>
   ```
