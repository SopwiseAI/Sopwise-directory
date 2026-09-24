---
description: 添加标签
---

# 添加标签

标签信息: $ARGUMENTS

## 执行步骤

1. 解析用户输入，格式: 标签名 [slug]
   - 如果未提供 slug，从标签名自动生成

2. 先查询现有标签避免重复:

   ```
   !`python skills/tools/api.py tags`
   ```

3. 创建标签:

   ```
   !`python skills/tools/api.py add-tag --name "标签名" --slug "slug"`
   ```

4. 告知用户标签已创建
