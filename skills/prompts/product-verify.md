# 产品校对 Prompt

## 级别定义

| 级别  | 含义   | 处理         |
| ----- | ------ | ------------ |
| ERROR | 必须修 | 阻断发布     |
| WARN  | 建议修 | 可发布但应修 |
| INFO  | 可选修 | 提示即可     |

## 校对清单

### 1. name 空/异常 — ERROR

- 判定: name 为 null/空串/纯空白 → ERROR
- 判定: name 含 HTML 标签（`<...>`）→ ERROR
- 判定: name 含明显拼写错乱（连续乱码）→ ERROR
- 修复: 清洗后 update-product

### 2. slug 与 name 对应 — WARN

- 刑定: name 为中文但 slug 为 `item-xxxx`（fallback）→ WARN
- 判定: name 为 "ChatGPT" slug 为 "chatgpt" → 通过
- 修复: 重新生成 slug

### 3. links 空 — ERROR

- 判定: links 数组长度为 0 → ERROR
- 修复: 需人工提供 URL，引导 `/std-enrich`

### 4. URL 格式 — WARN

- 判定: 不匹配 `^https?://.+` → WARN
- 修复: 引导修正

### 5. URL 可达 — INFO

- 方法: HEAD 请求，超时 5s
- 超时/非200 → INFO，不作错
- 不自动修，仅在清单标注

### 6. 重复产品 — ERROR

- 方法: name 完全相同（忽略大小写）→ ERROR
- 方法: url_hash 相同 → ERROR
- 修复: 引导删除重复项

### 7. category_id 空 — WARN

- 判定: null → WARN
- 修复: 引导 `/std-enrich` 匹配分类

### 8. pricing 合法 — WARN

- 判定: 非 free/freemium/paid/opensource → WARN
- 修复: update-product --pricing

### 9. description 空 — INFO

- 判定: null/空 → INFO
- 修复: 引导 `/std-enrich`

### 10. tags 空 — INFO

- 判定: tags 数组长度 0 → INFO
- 修复: 引导 `/std-enrich`

## 输出格式

按级别分组，每条含: 产品(名称+id) / 问题 / 建议

```
=== ERROR (2) ===
P1 (id=1)           links 为空                          添加产品链接
某工具 (id=88)      name 含 HTML 标签残留               清洗为纯文本

=== WARN (1) ===
ChatGPT (id=40)     slug=item-a3f2 与名称不对应          重新生成 slug

=== INFO (3) ===
Claude (id=38)      description 为空                    建议补全
Claude (id=38)      tags 为空                           建议补全
...
```

## 修复策略

| 问题            | 可自动修 | 方法                         |
| --------------- | -------- | ---------------------------- |
| name 含残留符号 | 是       | 清洗 + update                |
| slug 不对应     | 是       | 重新生成 + update            |
| links 空        | 否       | 引导人工                     |
| 重复            | 是       | 删除重复项（保留较早创建的） |
| pricing 非法    | 是       | 询用户后 update              |
| category 空     | 半       | 建议分类，询用户确认         |
| description 空  | 否       | 引导 enrich                  |
| tags 空         | 否       | 引导 enrich                  |
