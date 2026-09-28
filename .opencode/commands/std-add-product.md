---
description: 添加 AI 产品到目录（创建为草稿状态）
---

# 添加产品

用户要添加的产品信息: $ARGUMENTS

## 前置检查

先确认 studio 服务可用:

```
!`python skills/tools/api.py health`
```

如果连接失败，告知用户需先启动 studio: `./scripts/dev-studio.sh`

## 你的任务

1. 从用户输入解析产品名称和可选 URL
2. 产品默认创建为草稿状态 (status=0)
3. 如果用户提供了 URL，自动作为主链接

## 执行步骤

1. 查询现有分类，判断产品归属:

   ```
   !`python skills/tools/api.py categories`
   ```

2. 如果分类列表为空，询问用户是否先创建分类 (`/std-add-category`)
3. 如果分类不确定，列出候选分类询问用户选择

4. 创建产品。**只传用户实际提供的参数**，不要传占位符:

   ```
   !`python skills/tools/api.py add-product --name "用户给的产品名"`
   ```

   可选参数（仅在用户提供时追加）:
   - `--url "https://..."` — 产品官网链接
   - `--category-id <数字ID>` — 从分类列表中选取的 ID
   - `--pricing <值>` — 定价模式，仅接受: `free` / `freemium` / `paid` / `opensource`
   - `--description "一句话描述"` — 产品描述
   - `--featured` — 标记为精选
   - `--slug "english-slug"` — 自定义 slug；**中文产品名必须手动指定**（默认自动生成会丢失中文，如"通义千问"→"item-xxxx"）

5. 告知用户产品已创建为草稿，可用 `/std-enrich` 补全信息或 `/std-review` 提交审核
