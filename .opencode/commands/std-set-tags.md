---
description: 标签管理（列出全部标签 / 查看 / 设置某工具的标签）
---

# 标签管理

操作目标: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

新模型里标签只是 `xg_tool.tags` JSON 列（字符串数组），**没有独立实体、没有 `/tags` 端点**，所以没有"创建标签 / 删除标签 / 启用禁用"这些操作。标签的生命周期只附属于工具:

- 设置标签 = 直接改某个工具的 `tags` 字段
- 想让一个标签"消失" = 从所有工具的 `tags` 里移除它

## 执行步骤

1. 解析用户输入:
   - 无参数 → 列出全部标签及其工具数
   - 数字 ID 或工具名 → 查看/设置该工具的标签
   - 标签名 → 在所有工具里检索该标签

### 列表模式

2. 列出全部标签（客户端聚合去重，无后端端点）:

   ```
   !`python skills/tools/api.py tags`
   ```

   加 `--json` 可输出结构化结果。

### 查看某工具的标签

3. 先定位工具 ID，再读标签:

   ```
   python skills/tools/api.py tool-tags <工具ID>
   ```

### 设置某工具的标签

4. **set-tags 是全量替换**，会覆盖该工具现有标签。执行前必须先读现有标签:

   ```
   python skills/tools/api.py tool-tags <工具ID>
   ```

5. 传入包含**保留标签 + 新增标签**的完整列表:

   ```
   python skills/tools/api.py --yes set-tags <工具ID> --tags "保留的,新增的"
   ```

   传空串清空该工具的全部标签:

   ```
   python skills/tools/api.py --yes set-tags <工具ID> --tags ""
   ```

   - 最多 8 个标签
   - 标签不能重复、不能为空、首尾不能有空白、单个最长 32 字符（后端校验，违反返回 422）
   - 标签没有受控词表，注意同一含义别写成多个词（"开源" 与 "开放源代码" 会各算一个）

6. 告知用户操作结果

## 与旧模型的差异

- 旧 CLI 的 `add-tag` / `update-tag` / `delete-tag` / `tag-count` / `set-tags --tag-ids` 已全部移除
- 现在只有 `tags`（列出全部标签）、`tool-tags`（查看某工具标签）、`set-tags --tags`（全量替换某工具标签）
