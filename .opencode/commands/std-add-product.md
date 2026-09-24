---
description: 添加 AI 产品到目录（创建为草稿状态）
---

# 添加产品

用户要添加的产品信息: $ARGUMENTS

## 你的任务

1. 解析用户输入的产品名称和可选 URL
2. 使用 `skills/tools/api.py` 添加产品
3. 如果用户提供了 URL，自动作为主链接
4. 产品默认创建为草稿状态 (status=0)

## 执行步骤

1. 先查询现有分类，判断产品应归属哪个分类:
   ```
   !`python skills/tools/api.py categories`
   ```
2. 如果分类不确定，询问用户
3. 创建产品:
   ```
   !`python skills/tools/api.py add-product --name "产品名" --url "URL" --category-id <ID> --pricing <定价>`
   ```
4. 告知用户产品已创建为草稿，可使用 `/std-review` 提交审核
