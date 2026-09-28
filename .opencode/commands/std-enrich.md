---
description: AI 补全产品信息（描述、分类、标签、链接）
---

# 补全产品信息

要补全的产品 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 如果未提供 ID，列出草稿产品供用户选择:

   ```
   !`python skills/tools/api.py products --status 0`
   ```

2. 查看产品详情:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

   注意: 产品 URL 在返回数据的 `links` 数组中，取 `links[0].url`。tags 在 `tags` 数组中。

3. 分析缺失字段，制定补全计划:
   - description 为空 → 根据产品名和 URL 生成一句话描述
   - category_id 为空 → 查询分类列表，判断最合适的分类
   - tags 为空 → 生成 2-3 个标签
   - links 为空 → 根据产品名搜索官网，添加链接

4. 查询现有分类和标签:

   ```
   !`python skills/tools/api.py categories`
   !`python skills/tools/api.py tags`
   ```

5. 逐项补全:
   a. 更新描述和分类（只传需要更新的字段）:

   ```
   !`python skills/tools/api.py --yes update-product <产品ID> --description "描述内容" --category-id <分类ID>`
   ```

   b. 如果需要新标签，先创建（记录返回的 id 字段）:

   ```
   !`python skills/tools/api.py add-tag --name "标签名" --slug "tag-slug"`
   ```

   c. 设置标签。**set-tags 是全量替换**，会覆盖产品现有标签。执行前必须先读现有标签:

   ```
   !`python skills/tools/api.py product-tags <产品ID>`
   ```

   传入包含**现有标签 ID + 新标签 ID** 的完整列表:

   ```
   !`python skills/tools/api.py --yes set-tags <产品ID> --tag-ids 1,2,3
   ```

   d. 添加链接。先检查 links 数组是否已有相同 URL，避免重复添加:

   ```
   !`python skills/tools/api.py add-link <产品ID> --url "https://..." --primary`
   ```

6. 展示补全后的产品信息
7. 告知用户可用 `/std-review` 提交审核
