---
name: xigee
description: "XiGee Directory 数据管理 Skills。当用户需要添加/审核/发布/补全 AI 产品、管理分类和标签、导出数据时使用。通过 skills/tools/api.py 调用 studio API 完成数据管理。"
---

# XiGee Directory 数据管理

## 概述

本 Skill 集通过 `skills/tools/api.py` CLI 工具驱动 studio 后端 API，实现 AI 目录站的数据管理全流程。

## 产品生命周期

```
采集(/std-collect) → 草稿(0) → 补全(/std-enrich) → 提交(/std-submit) → 待审核(1)
                                                                        ↓
                                          校对(/std-verify) ← 审核打回(1→0)
                                                 ↓
                                          已发布(2) → 下架(3) → 重新发布(3→2)
```

横切动作（随时可调）: `/std-verify` 校对、`/std-list` 列出、`/std-stats` 总览

| 状态   | 值  | 说明                   | 导出 |
| ------ | --- | ---------------------- | ---- |
| 草稿   | 0   | 新创建，信息可能不完整 | 否   |
| 待审核 | 1   | 已提交，等待审核       | 否   |
| 已发布 | 2   | 审核通过，对外可见     | 是   |
| 已下架 | 3   | 已下线，不再展示       | 否   |

## 工具

### api.py

所有 API 操作通过 `skills/tools/api.py` 执行。写操作有以下安全机制：

| 机制         | 说明                               | 用法                                |
| ------------ | ---------------------------------- | ----------------------------------- |
| **Dry-Run**  | 预览变更，不实际写入               | 加 `--dry-run` 参数                 |
| **二次确认** | 删除/状态变更前询问确认            | 交互式输入 y/N，加 `--yes` 跳过     |
| **幂等键**   | 相同 `--op-id` 不会重复执行        | 加 `--op-id <值>`，自动生成在日志中 |
| **操作日志** | 每次写操作记录到 `tools/api.log`   | 自动开启                            |
| **读重试**   | GET 请求网络/5xx 退避重试 3 次     | 自动开启                            |
| **写不重试** | POST/PUT/DELETE 不重试，防重复写入 | 自动开启                            |
| **生产保护** | 探测后端环境为 prod 时强制门槛     | 见下                                |

### 生产环境保护

写操作执行前自动探测后端 `/api/v1/env`，若返回 `prod`:

- 所有写操作必须显式 `--yes`，否则拒绝 (exit 3)
- DELETE 操作额外必须 `--prod-confirm`，否则拒绝 (exit 3)
- 日志醒目记录 `PROD 写操作`

这保证模型在 prod 环境执行命令时不会"随意乱来"，任何破坏性操作都需要双重显式确认。

```bash
# 产品管理
python skills/tools/api.py products [--status N] [--search K]   # 列出产品
python skills/tools/api.py product <id>                         # 产品详情
python skills/tools/api.py add-product --name <name> [--url <url>] [--category-id <id>] [--sort-order <N>]
python skills/tools/api.py update-product <id> [--status <N>] [--name] [--slug] [--description] [--category-id] [--pricing] [--featured | --no-featured] [--sort-order <N>]
python skills/tools/api.py delete-product <id>

# 分类管理
python skills/tools/api.py categories [--status {0,1}]
python skills/tools/api.py add-category --name <name> --slug <slug> --icon <icon>
python skills/tools/api.py update-category <id> [--name] [--slug] [--icon] [--sort-order] [--status]
python skills/tools/api.py delete-category <id>
python skills/tools/api.py category-count <id>

# 标签管理
python skills/tools/api.py tags
python skills/tools/api.py add-tag --name <name> --slug <slug>
python skills/tools/api.py update-tag <id> [--name] [--slug]
python skills/tools/api.py delete-tag <id>
python skills/tools/api.py tag-count <id>

# 链接管理
python skills/tools/api.py product-links <id>
python skills/tools/api.py add-link <product_id> --url <url> [--primary]
python skills/tools/api.py update-link <product_id> <link_id> [--url] [--label] [--primary]
python skills/tools/api.py delete-link <product_id> <link_id>

# 标签关联
python skills/tools/api.py product-tags <id>
python skills/tools/api.py set-tags <product_id> --tag-ids 1,2,3

# 数据操作
python skills/tools/api.py export                        # 导出 → data-{env}.json; 仅 prod 同步 data.json
python skills/tools/api.py stats                         # 目录统计
python skills/tools/api.py health                        # 健康检查（含后端环境）
python skills/tools/api.py --version                     # 版本
```

## 环境变量

- `STUDIO_URL`: studio 服务地址（默认 `http://localhost:8000`）
- `STUDIO_API_KEY`: API 密钥
- `API_KEY`: 与 `STUDIO_API_KEY` 等效，二者设一个即可
- **未设环境变量时自动探测**: CLI 调后端 `/api/v1/env` 获取当前环境，读取 `studio/.env.{env}` 的 `API_KEY`，确保与后端不脱节

## 运行时文件

| 文件            | 说明                         |
| --------------- | ---------------------------- |
| `tools/api.log` | 操作日志，每次写操作自动记录 |
| `tools/.op_ids` | 已执行的操作 ID，自动管理    |

## 命令清单

| 命令                   | 说明                       |
| ---------------------- | -------------------------- |
| `/std-collect`         | 采集批量产品入库为草稿     |
| `/std-add-product`     | 添加产品（单条，草稿状态） |
| `/std-manage-product`  | 产品管理（查看/改/删）     |
| `/std-add-category`    | 添加分类                   |
| `/std-add-tag`         | 添加标签                   |
| `/std-manage-category` | 分类管理（查看/改/删）     |
| `/std-manage-tag`      | 标签管理（查看/改/删）     |
| `/std-enrich`          | AI 补全产品信息            |
| `/std-verify`          | 数据正确性校对             |
| `/std-submit`          | 提交审核 (0→1)             |
| `/std-review`          | 审核待审核产品             |
| `/std-publish`         | 发布产品                   |
| `/std-archive`         | 下架/重新发布 (2↔3)        |
| `/std-list`            | 列出产品                   |
| `/std-stats`           | 目录总览                   |
| `/std-export`          | 导出 JSON                  |

### 命名规范

- **生命周期动作**（产品专属流程）: `std-{动词}` — collect/enrich/verify/submit/review/publish/archive
- **CRUD 操作**（需区分实体）: `std-{动词}-{实体}` — add-product/manage-product/add-category/manage-category/add-tag/manage-tag
- **系统命令**: `std-{动词}` — stats/export

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
| 标签 | `product-tags`                                     | `GET /products/{id}` (取 tags 字段)      |
|      | `set-tags`                                         | `PUT /products/{id}/tags`                |
| 数据 | `export` `stats`                                   | `POST /export` + 聚合查询                |

所有列表命令均支持 `--page` 和 `--page-size` 分页参数。
