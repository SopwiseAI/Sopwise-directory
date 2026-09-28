---
description: 列出产品，支持按状态过滤和搜索
---

# 列出产品

过滤条件: $ARGUMENTS

## 执行步骤

1. 根据用户输入判断过滤条件:

   **按状态**:
   - "草稿" 或 "draft" → `--status 0`
   - "待审核" 或 "pending" → `--status 1`
   - "已发布" 或 "published" → `--status 2`
   - "已下架" 或 "archived" → `--status 3`
   - 无状态参数 → 不加 `--status`，列出全部

   **按分类**: 用户提供分类名或 ID → 先查分类列表定位 ID，加 `--category-id <ID>`

   **按精选**: 用户提到"精选"/"推荐" → 加 `--featured`

   多维过滤可组合:

   ```
   !`python skills/tools/api.py products --status 2 --category-id 3 --featured`
   ```

2. 如果用户提供了搜索关键词（非过滤关键词），使用 --search:

   ```
   !`python skills/tools/api.py products --search "关键词"`
   ```

   注意: 后端不支持 search 参数，CLI 做客户端过滤，底部"共 N 条"是后端全量计数，可能大于实际显示行数。

3. status + search + 其他过滤可组合:

   ```
   !`python skills/tools/api.py products --status 2 --search "chat" --featured`
   ```

4. 如果输出底部显示"共 N 条"且 N 大于当前显示数量，告知用户可翻页:
   - 下一页: `python skills/tools/api.py products --page 2`
   - 每页条数: `--page-size 50`

5. 如果结果为空，告知用户:
   - 该状态无产品 → 提示 `/std-collect` 采集或 `/std-add-product` 添加
   - 搜索无匹配 → 建议换关键词或 `/std-list` 查全量

6. 如果用户要查看某个产品详情，告知使用:
   ```
   python skills/tools/api.py product <产品ID>
   ```
