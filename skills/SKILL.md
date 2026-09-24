---
name: sopwise-directory
description: "Sopwise Directory 数据管理 Skills。当用户需要添加/审核/发布/补全 AI 产品、管理分类和标签、导出数据时使用。通过 skills/tools/api.py 调用 studio API 完成数据管理。"
---

# Sopwise Directory 数据管理

## 概述

本 Skill 集通过 `skills/tools/api.py` CLI 工具驱动 studio 后端 API，实现 AI 目录站的数据管理全流程。

## 产品生命周期

```
用户添加 → 草稿(0) → 提交审核 → 待审核(1) → 审核通过 → 已发布(2) → 下架 → 已下架(3)
                ↑__________________审核打回___________________|
```

| 状态   | 值  | 说明                   | 导出 |
| ------ | --- | ---------------------- | ---- |
| 草稿   | 0   | 新创建，信息可能不完整 | 否   |
| 待审核 | 1   | 已提交，等待审核       | 否   |
| 已发布 | 2   | 审核通过，对外可见     | 是   |
| 已下架 | 3   | 已下线，不再展示       | 否   |

## 工具

### api.py

所有 API 操作通过 `skills/tools/api.py` 执行：

```bash
# 产品管理
python skills/tools/api.py products [--status N]      # 列出产品
python skills/tools/api.py product <id>                 # 产品详情
python skills/tools/api.py add-product --name <name> [--url <url>] [--category-id <id>]
python skills/tools/api.py update-product <id> --status <N>
python skills/tools/api.py delete-product <id>

# 分类管理
python skills/tools/api.py categories
python skills/tools/api.py add-category --name <name> --slug <slug> --icon <icon>

# 标签管理
python skills/tools/api.py tags
python skills/tools/api.py add-tag --name <name> --slug <slug>

# 链接管理
python skills/tools/api.py product-links <id>
python skills/tools/api.py add-link <product_id> --url <url> [--primary]

# 标签关联
python skills/tools/api.py product-tags <id>
python skills/tools/api.py set-tags <product_id> --tag-ids 1,2,3

# 数据操作
python skills/tools/api.py export                        # 导出 JSON
python skills/tools/api.py stats                         # 目录统计
```

## 环境变量

- `STUDIO_URL`: studio 服务地址（默认 `http://localhost:8000`）
- `STUDIO_API_KEY`: API 密钥（默认 `dev-secret-key`）

## 命令清单

| 命令                | 说明                 |
| ------------------- | -------------------- |
| `/std-add-product`  | 添加产品（草稿状态） |
| `/std-review`       | 审核待审核产品       |
| `/std-publish`      | 发布产品             |
| `/std-enrich`       | AI 补全产品信息      |
| `/std-list`         | 列出产品             |
| `/std-add-category` | 添加分类             |
| `/std-add-tag`      | 添加标签             |
| `/std-export`       | 导出 JSON            |
| `/std-status`       | 目录总览             |
