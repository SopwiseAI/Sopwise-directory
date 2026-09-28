---
description: 添加分类
---

# 添加分类

分类信息: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 解析用户输入，格式: 分类名 [图标名]
   - 如果用户未提供图标，使用默认图标 `Bot`

2. 生成 slug 规则:
   - 英文分类名: 转小写，空格转连字符 (如 "Code Tools" → "code-tools")
   - 中文分类名: 用拼音或英文翻译 (如 "对话助手" → "chat-assistant")
   - slug 只能含小写字母、数字、连字符

3. 查询现有分类，检查 name 和 slug 是否重复:

   ```
   !`python skills/tools/api.py categories`
   ```

   如果 name 或 slug 已存在，告知用户并停止。

4. 创建分类（三个参数均为必填）:

   ```
   !`python skills/tools/api.py add-category --name "分类名" --slug "english-slug" --icon "IconName"`
   ```

   图标名使用 lucide-react 图标库，常用参考:
   - 对话类: `MessageSquare`
   - 绘画类: `Image`
   - 编程类: `Code`
   - 写作类: `PenLine`
   - 视频类: `Video`
   - 音频类: `Music`
   - 搜索类: `Search`
   - 通用: `Bot` / `Sparkles` / `Wrench`

5. 告知用户分类已创建
