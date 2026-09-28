---
description: 添加标签
---

# 添加标签

标签信息: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 解析用户输入，格式: 标签名 [slug]
   - 如果用户提供了 slug，直接使用
   - 如果未提供 slug，按规则自动生成: 转小写，空格转连字符，中文用拼音
   - slug 只能含小写字母、数字、连字符

2. 查询现有标签，检查 name 和 slug 是否重复:

   ```
   !`python skills/tools/api.py tags --json`
   ```

   重复判定: name 完全相同（忽略大小写）→ 拒；slug 完全相同 → 拒。任一命中即告知用户并停止，不发起创建请求。

3. 创建标签（name 和 slug 均为必填）:

   ```
   !`python skills/tools/api.py add-tag --name "标签名" --slug "english-slug"`
   ```

4. 告知用户标签已创建
