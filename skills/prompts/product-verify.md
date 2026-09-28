# 产品校对 Prompt

## 级别定义

| 级别  | 含义   | 处理         |
| ----- | ------ | ------------ |
| ERROR | 必须修 | 阻断发布     |
| WARN  | 建议修 | 可发布但应修 |
| INFO  | 可选   | 提示即可     |

## 校对清单

### 1. name 空/异常 — ERROR

- 判定: name 为 null/空串/纯空白 → ERROR
- 判定: name 含 HTML 标签（`<...>`）→ ERROR
- 判定: name 含明显拼写错乱（连续乱码）→ ERROR
- 修复: 清洗后 update-product

### 2. slug 与 name 对应 — WARN

- 判定: name 为中文但 slug 为 `item-xxxx`（fallback）→ WARN
- 判定: name 为中文但 slug 含不可识别字符残留 → WARN
- 判定: slug 与 name 无任何关联 → WARN
- 通过: name 为 "ChatGPT" slug 为 "chatgpt"
- 修复: 重新生成 slug（优先官方英文名，无则拼音）

### 3. links 空 — ERROR

- 判定: links 数组长度为 0 → ERROR
- 修复: 需人工提供 URL，引导 `/std-enrich`

### 4. URL 格式 — ERROR

- 判定: 不匹配 `^https?://.+` → ERROR（非 WARN，格式错无法发布）
- 修复: 引导修正

### 5. URL 未归一化 — WARN

- 判定: URL 含 utm_*、fbclid、gclid 等追踪参数 → WARN
- 判定: 域名含大写、有尾斜杠、带片段 → WARN
- 修复: 归一化后 update-link
- 归一化规则见 product-collect.md 的 URL 归一化段

### 6. URL 可达 — INFO

- 方法: HEAD 请求，超时 5s，跟随重定向（最多5跳）
- 超时/非200 → INFO，不作错（仅提示，可能临时不可达）
- 不自动修，仅在清单标注

### 7. 重复产品 — ERROR

- 方法: name 完全相同（忽略大小写）→ ERROR
- 方法: 归一化 url 相同 → ERROR
- 修复: 引导删除重复项（保留较早创建的）

### 8. category_id 空 — WARN

- 判定: null → WARN
- 修复: 引导 `/std-enrich` 匹配分类

### 9. pricing 合法 — WARN

- 判定: 非 free/freemium/paid/opensource → WARN
- 修复: update-product --pricing

### 10. description 空 — INFO

- 判定: null/空 → INFO
- 修复: 引导 `/std-enrich`

### 11. tags 空 — INFO

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
| URL 格式错      | 否       | 引导修正                     |
| URL 未归一化    | 是       | 归一化 + update-link         |
| 重复            | 是       | 删除重复项（保留较早创建的） |
| pricing 非法    | 是       | 询用户后 update              |
| category 空     | 半       | 建议分类，询用户确认         |
| description 空  | 否       | 引导 enrich                  |
| tags 空         | 否       | 引导 enrich                  |
