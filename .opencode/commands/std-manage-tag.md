---
description: 标签管理（查看/改名/改slug/删除）
---

# 标签管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

对标签执行 CRUD 闭环管理: 列表（带产品数）、查看详情、更新字段、删除。

## 执行步骤

1. 解析用户输入:
   - 无参数 → 进入列表模式
   - 数字 ID → 查看该标签详情并提供操作菜单
   - 非数字 → 理解为标签名，先查列表定位 ID

### 列表模式

2. 拉取全部标签:

   ```
   !`python skills/tools/api.py tags --json`
   ```

3. 对每个标签查关联产品数:

   ```
   !`python skills/tools/api.py tag-count <标签ID>`
   ```

   注意: tag-count 统计所有状态的关联产品（不限已发布）。

4. 输出表格: ID / 名称 / Slug / 关联产品数。告知用户可指定 ID 进一步操作。

### 详情模式

5. 查看标签详情:

   ```
   !`python skills/tools/api.py tag <标签ID>`
   ```

6. 根据用户意图执行对应操作:

   **改名 / 改 slug**:

   ```
   !`python skills/tools/api.py --yes update-tag <标签ID> --name "新名"`
   ```

   仅传需改的字段，可选: `--name` `--slug`

   slug 修改须遵守统一 slug 规范（见末尾）。

   **删除标签**:

   先强制查关联产品数:

   ```
   !`python skills/tools/api.py tag-count <标签ID>`
   ```

   - count > 0 → 拒绝删除，告知用户"该标签关联 N 个产品，请先解除关联（set-tags 移除该 ID）后再删"
   - count = 0 → 执行删除:

     ```
     !`python skills/tools/api.py --yes delete-tag <标签ID>`
     ```

7. 告知用户操作结果

## slug 规范（创建/修改标签共用）

- 英文名: 转小写，空格转连字符 (如 "Code Tools" → "code-tools")
- 中文名: 用拼音或英文翻译 (如 "对话助手" → "chat-assistant")
- 只能含小写字母、数字、连字符
- 重复检测: 修改前查现有标签，name 和 slug 均不可与已有重复
