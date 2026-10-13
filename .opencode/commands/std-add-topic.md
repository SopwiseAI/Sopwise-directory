---
description: 添加主题
---

# 添加主题

主题信息: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 解析用户输入，格式: 主题名 [图标名]
   - 如果用户未提供图标，交给后端默认值 `Box`

2. 生成 slug 规则:
   - 英文主题名: 转小写，空格转连字符 (如 "Code Tools" → "code-tools")
   - 中文主题名: 用拼音或英文翻译 (如 "对话助手" → "chat-assistant")
   - slug 只能含小写字母、数字、连字符

3. 查询现有主题，检查 name 和 slug 是否重复:

   ```
   !`python skills/tools/api.py topics --json`
   ```

   重复判定: name 完全相同（忽略大小写）→ 拒；slug 完全相同 → 拒。任一命中即告知用户并停止，不发起创建请求。

4. 创建主题（name 和 slug 必填，其余可选）:

   ```
   !`python skills/tools/api.py add-topic --name "主题名" --slug "english-slug" [--icon "IconName"]`
   ```

   图标名使用 lucide-react 图标库，常用参考:
   - 对话类: `MessageSquare`
   - 绘画类: `Image`
   - 编程类: `Code`
   - 写作类: `PenLine`
   - 视频类: `Video`
   - 音频类: `Music`
   - 搜索类: `Search`
   - 通用: `Box` / `Sparkles` / `Wrench`

   其他可选参数: `--description "主题简介"` `--sort-order <N>` `--status active|disabled`

5. 告知用户主题已创建
