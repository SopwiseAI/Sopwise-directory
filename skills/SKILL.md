---
name: xigee
description: "XiGee Directory 数据管理 Skills。当用户需要添加/审核/发布/补全 AI 工具、管理主题与标签、导出数据时使用。通过 skills/tools/api.py 调用 studio API 完成数据管理。"
---

# XiGee Directory 数据管理

## 概述

本 Skill 集通过 `skills/tools/api.py` CLI 工具驱动 studio 后端 API，实现 AI 目录站的数据管理全流程。

## 工具生命周期

```
采集(/std-collect) → 草稿(draft) → 补全(/std-enrich) → 提交(/std-submit) → 待审核(pending)
      ↑                                                                        │
      └──── 审核打回(pending→draft, /std-review) ──────────────────────────────┤
                                                                              ▼
                                                       审核通过(pending→published, /std-review)
                                                                              ▼
                                                    已发布(published) ⇄ 下架/重新发布(archived)
```

横切动作（随时可调）: `/std-verify` 校对、`/std-list` 列出、`/std-stats` 总览

| 状态   | 值        | 说明                         | 导出 |
| ------ | --------- | ---------------------------- | ---- |
| 草稿   | draft     | 新创建，信息可能不完整       | 否   |
| 待审核 | pending   | 已提交，等待审核             | 否   |
| 已发布 | published | 审核通过，且存在 active 链接 | 是   |
| 已下架 | archived  | 已下线，不再展示             | 否   |

合法状态迁移: draft→pending, pending→draft, pending→published, published→archived, archived→published。
非法迁移后端返回 409。主题状态为 `active` / `disabled`，链接状态为 `active` / `broken` / `disabled`。

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
# 工具管理
python skills/tools/api.py tools [--status draft|pending|published|archived] [--topic-id N] [--featured] [--search K]   # 列出工具
python skills/tools/api.py tool <id>                            # 工具详情
python skills/tools/api.py add-tool --name <name> --tagline <一句话> --pricing <free|freemium|paid> \
    --origin <cn|overseas> --access <direct|proxy> --languages zh,en \
    [--url <url>] [--topic-ids 1,2] [--primary-topic-id N] [--tags a,b] [--open-source] [--featured] [--sort-order N]
python skills/tools/api.py update-tool <id> [--status <值>] [--name] [--slug] [--tagline] [--description] \
    [--pricing] [--origin] [--access] [--languages zh,en] [--tags a,b] [--topic-ids 1,2] [--primary-topic-id N] \
    [--open-source | --no-open-source] [--featured | --no-featured] [--sort-order N]
python skills/tools/api.py delete-tool <id>

# 主题管理
python skills/tools/api.py topics [--status active|disabled]
python skills/tools/api.py topic <id>
python skills/tools/api.py add-topic --name <name> --slug <slug> [--icon <icon>] [--description] [--sort-order N] [--status active|disabled]
python skills/tools/api.py update-topic <id> [--name] [--slug] [--icon] [--description] [--sort-order] [--status]
python skills/tools/api.py delete-topic <id>
python skills/tools/api.py topic-count <id>                     # 主题下已发布工具数
python skills/tools/api.py topic-tools <id>                     # 主题下全部工具

# 链接管理
python skills/tools/api.py tool-links <id> [--status active|broken|disabled]
python skills/tools/api.py add-link <tool_id> --url <url> [--label website|api|docs|github|playground|pricing|plugin|other] [--primary] [--status active|broken|disabled]
python skills/tools/api.py update-link <tool_id> <link_id> [--url] [--label] [--primary | --no-primary] [--status]
python skills/tools/api.py delete-link <tool_id> <link_id>

# 主题归属（全量替换）
python skills/tools/api.py tool-topics <id>
python skills/tools/api.py set-topics <tool_id> --topic-ids 1,2 [--primary-topic-id N]

# 标签（工具字段，无独立端点）
python skills/tools/api.py tags                                 # 列出全部标签（客户端聚合）
python skills/tools/api.py tool-tags <id>                       # 查看某工具标签
python skills/tools/api.py set-tags <tool_id> --tags a,b,c      # 全量替换某工具标签

# 数据操作
python skills/tools/api.py export                        # 导出 → topics-{env}.json + tools-{env}.json; 仅 prod 同步 topics.json + tools.json
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

| 命令                | 说明                                  |
| ------------------- | ------------------------------------- |
| `/std-collect`      | 采集批量工具入库为草稿                |
| `/std-add-tool`     | 添加工具（单条，草稿状态）            |
| `/std-manage-tool`  | 工具管理（查看/改/删/链接/主题/标签） |
| `/std-add-topic`    | 添加主题                              |
| `/std-manage-topic` | 主题管理（查看/改/删）                |
| `/std-set-tags`     | 标签管理（列出/查看/设置）            |
| `/std-enrich`       | AI 补全工具信息                       |
| `/std-verify`       | 数据正确性校对                        |
| `/std-submit`       | 提交审核 (draft→pending)              |
| `/std-review`       | 审核待审核工具                        |
| `/std-publish`      | 发布工具                              |
| `/std-archive`      | 下架/重新发布 (published↔archived)    |
| `/std-list`         | 列出工具                              |
| `/std-stats`        | 目录总览                              |
| `/std-export`       | 导出 JSON                             |

### 命名规范

- **生命周期动作**（工具专属流程）: `std-{动词}` — collect/enrich/verify/submit/review/publish/archive
- **CRUD 操作**（需区分实体）: `std-{动词}-{实体}` — add-tool/manage-tool/add-topic/manage-topic
- **字段操作**: `std-set-tags`（标签是工具字段，没有独立生命周期）
- **系统命令**: `std-{动词}` — stats/export

### 完整 API 覆盖（12 paths / 20 operations）

| 分类     | api.py 命令                               | 对应后端接口                                  |
| -------- | ----------------------------------------- | --------------------------------------------- |
| 系统     | `health`                                  | `GET /health`                                 |
|          | `env`                                     | `GET /env`                                    |
| 主题     | `topics` `topic`                          | `GET /topics` `GET /topics/{id}`              |
|          | `add-topic` `update-topic` `delete-topic` | CRUD                                          |
|          | `topic-tools`                             | `GET /topics/{id}/tools`                      |
|          | `topic-count`                             | `GET /topics/{id}/tool-count`                 |
| 工具     | `tools` `tool`                            | `GET /tools` `GET /tools/{id}`                |
|          | `add-tool` `update-tool` `delete-tool`    | CRUD                                          |
| 链接     | `tool-links`                              | `GET /tools/{id}/links`                       |
|          | `add-link` `update-link` `delete-link`    | CRUD                                          |
| 主题归属 | `tool-topics` `set-topics`                | `GET /tools/{id}` + `PUT /tools/{id}/topics`  |
| 标签     | `tags` `tool-tags`                        | 客户端聚合 + `GET /tools/{id}` (取 tags 字段) |
|          | `set-tags`                                | `PUT /tools/{id}`                             |
| 数据     | `export` `stats`                          | `POST /export` (export) / 聚合查询 (stats)    |

所有列表命令均支持 `--page` 和 `--page-size` 分页参数。
