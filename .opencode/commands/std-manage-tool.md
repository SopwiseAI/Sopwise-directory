---
description: 工具管理（查看/改名/改 slug/改主题/改定价/改标签/管理链接/删除）
---

# 工具管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

对工具执行 CRUD 闭环管理: 查看详情、更新字段、管理链接、管理主题归属与标签、删除。

## 执行步骤

1. 解析用户输入:
   - 无参数 → 建议用 `/std-list` 列出工具
   - 数字 ID → 查看该工具详情并提供操作菜单
   - 非数字 → 理解为工具名，先查列表定位 ID

### 详情模式

2. 查看工具详情（含 topics、links、tags）:

   ```
   python skills/tools/api.py tool <工具ID>
   ```

3. 根据用户意图执行对应操作:

   **改名 / 改 slug / 改 tagline / 改描述 / 改定价 / 改地域 / 改访问方式 / 改语言 / 改精选 / 改开源 / 改排序**:

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --name "新名"
   ```

   仅传需改的字段，可选:
   - `--name "新名"` — 工具名（唯一）
   - `--slug "english-slug"` — URL slug（唯一）；中文名须指定有效拼音/英文 slug
   - `--tagline "一句话简介。"` — 卡片文案，须以标点结尾
   - `--description "描述"` — 较长说明
   - `--pricing <值>` — 仅接受: `free` / `freemium` / `paid`
   - `--origin <值>` — 仅 `cn` / `overseas`
   - `--access <值>` — 仅 `direct` / `proxy`
   - `--languages zh,en` — ISO 639-1 逗号分隔，全量替换
   - `--tags a,b` — 逗号分隔，全量替换；传空串 `""` 清空
   - `--topic-ids 1,2,3` — 逗号分隔的主题 ID，全量替换；传空串 `""` 清空
   - `--primary-topic-id <N>` — 主主题，必须在 `--topic-ids` 里
   - `--open-source` / `--no-open-source` — 设置/取消开源
   - `--featured` / `--no-featured` — 设置/取消精选
   - `--sort-order <数字>` — 排序权重

   （导出里的 `lastUpdatedAt` 取审计列 `updated_at`，不再是可填字段；`publishedAt` 也由端点首次转 published 时写入）

   **改状态**（非法迁移后端返回 409）:

   合法迁移: draft→pending, pending→draft, pending→published, published→archived, archived→published

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --status pending
   ```

   状态取值: `draft` / `pending` / `published` / `archived`（不再是 0/1/2/3）

   `--status` 传**同值**（如把已发布的工具再设为 published）是静默 no-op，exit 0，不报错。

   slug 修改须遵守统一 slug 规范（见末尾）。

   **管理链接**:

   先列出当前链接:

   ```
   python skills/tools/api.py tool-links <工具ID>
   ```

   添加链接:

   ```
   python skills/tools/api.py add-link <工具ID> --url "https://..." [--label docs] [--primary] [--status active]
   ```

   更新链接:

   ```
   python skills/tools/api.py update-link <工具ID> <链接ID> [--url] [--label] [--primary | --no-primary] [--status]
   ```

   删除链接（带交互式二次确认，非交互场景必须加 `--yes`）:

   ```
   python skills/tools/api.py --yes delete-link <工具ID> <链接ID>
   ```

   - 每个工具只能有一个 primary link，后端强制唯一性
   - `--label` 仅 `website` / `api` / `docs` / `github` / `playground` / `pricing` / `plugin` / `other`
   - `--status` 仅 `active` / `broken` / `disabled`

   **管理主题归属**（全量替换，不能只加不删）:

   先读现有归属:

   ```
   python skills/tools/api.py tool-topics <工具ID>
   ```

   设置归属（传入完整主题 ID 列表）:

   ```
   python skills/tools/api.py --yes set-topics <工具ID> --topic-ids 1,2 --primary-topic-id 1
   ```

   清空归属**唯一可行**的路径是 `update-tool`（`set-topics --topic-ids ""` 会被 CLI 直接拒绝:
   `--topic-ids 不能为空`，exit 1）:

   ```
   python skills/tools/api.py --yes update-tool <工具ID> --topic-ids ""
   ```

   **管理标签**（标签是工具字段，全量替换）:

   先读现有标签:

   ```
   python skills/tools/api.py tool-tags <工具ID>
   ```

   设置标签:

   ```
   python skills/tools/api.py --yes set-tags <工具ID> --tags a,b,c
   ```

   如需新标签，直接把它加进 `--tags` 列表即可（标签没有独立生命周期）。

   **删除工具**:

   ⚠️ 不可逆操作。先确认工具状态:

   - 已发布 (status=published) → 建议先 `/std-archive` 下架再删
   - 有关联链接/主题归属 → 后端 CASCADE 自动清理

   ```
   python skills/tools/api.py --yes delete-tool <工具ID>
   ```

   prod 环境需额外 `--prod-confirm`（CLI 自动拦截；但 `STUDIO_URL` 是 loopback 时 CLI 跳过
   探测，本地以 `APP_ENV=prod` 起的 studio 不拦）。

4. 告知用户操作结果

## slug 规范（创建/修改工具共用）

- 英文名: 转小写，空格转连字符 (如 "Chat GPT" → "chat-gpt")
- 中文名: 用拼音或英文翻译 (如 "通义千问" → "tongyi-qianwen")
- 只能含小写字母、数字、连字符
- 重复检测: 修改前查现有工具，name 和 slug 均不可与已有重复
