---
description: 产品管理（查看/改名/改slug/改分类/改定价/改精选/改排序/管理链接/删除）
---

# 产品管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

对产品执行 CRUD 闭环管理: 查看详情、更新字段、管理链接、管理标签、删除。

## 执行步骤

1. 解析用户输入:
   - 无参数 → 建议用 `/std-list` 列出产品
   - 数字 ID → 查看该产品详情并提供操作菜单
   - 非数字 → 理解为产品名，先查列表定位 ID

### 详情模式

2. 查看产品详情（含 links 和 tags）:

   ```
   !`python skills/tools/api.py product <产品ID>`
   ```

3. 根据用户意图执行对应操作:

   **改名 / 改 slug / 改描述 / 改分类 / 改定价 / 改精选 / 改排序**:

   ```
   !`python skills/tools/api.py --yes update-product <产品ID> --name "新名"
   ```

   仅传需改的字段，可选:
   - `--name "新名"` — 产品名（唯一）
   - `--slug "english-slug"` — URL slug（唯一）；中文产品名须指定有效拼音/英文 slug
   - `--description "描述"` — 产品描述
   - `--category-id <数字ID>` — 分类 ID；清除分类需用 `/std-enrich` 说明
   - `--pricing <值>` — 仅接受: `free` / `freemium` / `paid` / `opensource`
   - `--featured` / `--no-featured` — 设置/取消精选
   - `--sort-order <数字>` — 排序权重

   slug 修改须遵守统一 slug 规范（见末尾）。

   **管理链接**:

   先列出当前链接:

   ```
   !`python skills/tools/api.py product-links <产品ID>
   ```

   添加链接:

   ```
   !`python skills/tools/api.py add-link <产品ID> --url "https://..." [--label "标签"] [--primary]
   ```

   更新链接:

   ```
   !`python skills/tools/api.py update-link <产品ID> <链接ID> [--url] [--label] [--primary | --no-primary]
   ```

   删除链接:

   ```
   !`python skills/tools/api.py delete-link <产品ID> <链接ID>
   ```

   注意: 每个产品只能有一个 primary link，后端强制唯一性。

   **管理标签**:

   先读现有标签（set-tags 是全量替换，不能只加不删）:

   ```
   !`python skills/tools/api.py product-tags <产品ID>
   ```

   设置标签（传入完整标签 ID 列表）:

   ```
   !`python skills/tools/api.py --yes set-tags <产品ID> --tag-ids 1,2,3
   ```

   如需新标签，先用 `/std-add-tag` 创建，拿到 ID 后再加入列表。

   **删除产品**:

   ⚠️ 不可逆操作。先确认产品状态:
   - 已发布 (status=2) → 建议先 `/std-archive` 下架再删
   - 有关联链接/标签 → 后端 CASCADE 自动清理

   ```
   !`python skills/tools/api.py --yes delete-product <产品ID>
   ```

   prod 环境需额外 `--prod-confirm`（CLI 自动拦截）。

4. 告知用户操作结果

## slug 规范（创建/修改产品共用）

- 英文名: 转小写，空格转连字符 (如 "Chat GPT" → "chat-gpt")
- 中文名: 用拼音或英文翻译 (如 "通义千问" → "tongyi-qianwen")
- 只能含小写字母、数字、连字符
- 重复检测: 修改前查现有产品，name 和 slug 均不可与已有重复
