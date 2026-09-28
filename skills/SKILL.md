---
name: xigee
description: "XiGee Directory 数据管理 Skills。当用户需要添加/审核/发布/补全 AI 产品、管理分类和标签、导出数据时使用。通过 skills/tools/api.py 调用 studio API 完成数据管理。"
---

# XiGee Directory 数据管理

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

所有 API 操作通过 `skills/tools/api.py` 执行。写操作有以下安全机制：

| 机制         | 说明                             | 用法                                |
| ------------ | -------------------------------- | ----------------------------------- |
| **Dry-Run**  | 预览变更，不实际写入             | 加 `--dry-run` 参数                 |
| **二次确认** | 删除/状态变更前询问确认          | 交互式输入 y/N，加 `--yes` 跳过     |
| **幂等键**   | 相同 `--op-id` 不会重复执行      | 加 `--op-id <值>`，自动生成在日志中 |
| **操作日志** | 每次写操作记录到 `tools/api.log` | 自动开启                            |
| **自动重试** | 网络错误退避重试 3 次            | 自动开启，业务错误不重试            |

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
- `STUDIO_API_KEY`: API 密钥（**必须设置**）
- `API_KEY`: 与 `STUDIO_API_KEY` 等效，二者设一个即可

## 运行时文件

| 文件            | 说明                         |
| --------------- | ---------------------------- |
| `tools/api.log` | 操作日志，每次写操作自动记录 |
| `tools/.op_ids` | 已执行的操作 ID，自动管理    |

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

### 完整 API 覆盖（25/25 接口）

| 分类 | api.py 命令                                        | 对应后端接口                             |
| ---- | -------------------------------------------------- | ---------------------------------------- |
| 系统 | `health`                                           | `GET /health`                            |
|      | `env`                                              | `GET /env`                               |
| 产品 | `products` `product`                               | `GET /products` `GET /products/{id}`     |
|      | `add-product` `update-product` `delete-product`    | CRUD                                     |
| 分类 | `categories` `category`                            | `GET /categories` `GET /categories/{id}` |
|      | `add-category` `update-category` `delete-category` | CRUD                                     |
|      | `category-count`                                   | `GET /categories/{id}/count`             |
| 标签 | `tags` `tag`                                       | `GET /tags` `GET /tags/{id}`             |
|      | `add-tag` `update-tag` `delete-tag`                | CRUD                                     |
|      | `tag-count`                                        | `GET /tags/{id}/count`                   |
| 链接 | `product-links`                                    | `GET /products/{id}/links`               |
|      | `add-link` `update-link` `delete-link`             | CRUD                                     |
|      | `product-tags` `set-tags`                          | `PUT /products/{id}/tags`                |
| 数据 | `export` `stats`                                   | `POST /export` + 聚合查询                |

所有列表命令均支持 `--page` 和 `--page-size` 分页参数。
