---
description: AI 补全产品信息（描述、分类、标签、链接）
---

# 补全产品信息

要补全的产品 ID: $ARGUMENTS

## 你的任务

根据产品名称和已有信息，AI 搜索并补全缺失的产品字段。

## 执行步骤

1. 如果未提供 ID，列出草稿产品:

   ```
   !`python skills/tools/api.py products --status 0`
   ```

2. 查看产品详情:

   ```
   !`python skills/tools/api.py product <ID>`
   ```

3. 分析缺失字段，补全计划:
   - description 为空 → 根据产品名和 URL 生成一句话描述
   - category_id 为空 → 查询分类列表，判断最合适的分类
   - tags 为空 → 生成 2-3 个标签
   - links 为空 → 如果有 URL 信息，添加链接

4. 查询现有分类和标签:

   ```
   !`python skills/tools/api.py categories`
   !`python skills/tools/api.py tags`
   ```

5. 逐项补全:
   a. 更新描述和分类:

   ```
   !`python skills/tools/api.py update-product <ID> --description "描述" --category-id <ID>`
   ```

   b. 如果需要新标签，先创建:

   ```
   !`python skills/tools/api.py add-tag --name "标签名" --slug "tag-slug"`
   ```

   c. 设置标签:

   ```
   !`python skills/tools/api.py set-tags <ID> --tag-ids 1,2,3`
   ```

   d. 添加链接:

   ```
   !`python skills/tools/api.py add-link <ID> --url "URL" --primary`
   ```

6. 展示补全后的产品信息
7. 询问用户是否提交审核 (`/std-review`)
