---
description: 添加分类
---

# 添加分类

分类信息: $ARGUMENTS

## 执行步骤

1. 解析用户输入，格式: 分类名 图标名
   - 图标名使用 lucide-react 图标库的名称（如 MessageSquare、Image、Code）
   - 如果用户未提供图标，询问或使用默认图标 Bot

2. 生成 slug（分类名的英文 slug 或拼音）

3. 先查询现有分类避免重复:

   ```
   !`python skills/tools/api.py categories`
   ```

4. 创建分类:

   ```
   !`python skills/tools/api.py add-category --name "分类名" --slug "slug" --icon "IconName"`
   ```

5. 告知用户分类已创建
