---
description: 分类管理（查看/改名/改slug/改图标/删除）
---

# 分类管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

对分类执行 CRUD 闭环管理: 列表（带产品数）、查看详情、更新字段、删除。

## 执行步骤

1. 解析用户输入:
   - 无参数 → 进入列表模式
   - 数字 ID → 查看该分类详情并提供操作菜单
   - 非数字 → 理解为分类名，先查列表定位 ID

### 列表模式

2. 拉取全部分类:

   ```
   !`python skills/tools/api.py categories --json`
   ```

3. 对每个分类查关联产品数:

   ```
   !`python skills/tools/api.py category-count <分类ID>`
   ```

   注意: category-count 仅统计 status=2（已发布）产品，未发布产品不计入。

4. 输出表格: ID / 名称 / Slug / 图标 / 已发布产品数 / 状态。告知用户可指定 ID 进一步操作。

### 详情模式

5. 查看分类详情:

   ```
   !`python skills/tools/api.py category <分类ID>`
   ```

6. 根据用户意图执行对应操作:

   **改名 / 改 slug / 改图标 / 改排序**:

   ```
   !`python skills/tools/api.py --yes update-category <分类ID> --name "新名"`
   ```

   仅传需改的字段，可选: `--name` `--slug` `--icon` `--sort-order` `--status`(0禁用/1启用)

   slug 修改须遵守统一 slug 规范（见末尾）。

   **删除分类**:

   注意: category-count 仅统计 status=2 已发布产品，但后端删除拦截统计**所有状态**产品。即 count=0 不代表可删，仍可能有草稿/待审核产品关联。先查 count，再参考 stats 确认无关联后删除:

   ```
   !`python skills/tools/api.py category-count <分类ID>`
   ```

   - 后端拒绝（HTTP 409: Category has N products）→ 告知用户"该分类下有 N 个产品（含未发布），请先迁移或删除这些产品"
   - 后端放行 → 删除成功，告知用户

7. 告知用户操作结果

## slug 规范（创建/修改分类共用）

- 英文名: 转小写，空格转连字符 (如 "Code Tools" → "code-tools")
- 中文名: 用拼音或英文翻译 (如 "对话助手" → "chat-assistant")
- 只能含小写字母、数字、连字符
- 重复检测: 修改前查现有分类，name 和 slug 均不可与已有重复
