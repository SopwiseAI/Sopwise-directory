# 工具校对 Prompt

## 级别定义

| 级别  | 含义   | 处理         |
| ----- | ------ | ------------ |
| ERROR | 必须修 | 阻断发布     |
| WARN  | 建议修 | 可发布但应修 |
| INFO  | 可选   | 提示即可     |

## 校对清单

校对不仅看字段**有无**，更要校内容**对错**。

### 1. name 异常 — ERROR

- 判定: name 为 null/空串/纯空白 → ERROR
- 判定: name 长度 >128 → ERROR
- 判定: name 含 HTML 标签（`<...>`）→ ERROR
- 判定: name 含明显拼写错乱（连续乱码）→ ERROR
- 修复: 清洗后 `update-tool`

### 2. slug 与 name 对应 — WARN

- 判定: name 为中文但 slug 为 `item-xxxx`（fallback）→ WARN
- 判定: name 为中文但 slug 含不可识别字符残留 → WARN
- 判定: slug 与 name 无任何关联 → WARN
- 判定: slug 长度 >64 → ERROR
- 通过: name 为 "ChatGPT" slug 为 "chatgpt"
- 修复: 重新生成 slug（优先官方英文名，无则拼音）

### 3. tagline — ERROR

- 判定: tagline 为空 → ERROR
- 判定: tagline 不以标点（。 . ! ? ！ ？ … 等）结尾 → ERROR
- 判定: tagline 长度 >100 → ERROR
- 修复: 补写一句话简介并加句末标点后 `update-tool --tagline`

### 4. links — ERROR

- 判定: links 数组长度为 0 → ERROR
- 判定: links 中存在重复归一化 URL → ERROR
- 判定: 主链接缺失（无 is_primary=true 项）→ WARN
- 修复: 引导 `/std-enrich` 补全

### 5. URL 格式 — ERROR

- 判定: 不匹配 `^https?://.+` → ERROR（格式错无法发布）
- 判定: 非本地地址用 `http`（如 `http://example.com`）→ ERROR（写入端只放行 https；仅 `localhost` / `127.0.0.1` / `::1` / `0.0.0.0` 可用 http）
- 判定: 长度 >2048 → ERROR
- 修复: 引导修正

### 6. URL 正确性 — WARN

- 判定: URL 非工具官网（指向第三方导购站/应用商店/社交媒体而非工具官网）→ WARN
- 判定: URL 不可达（HEAD 请求超时 5s，跟随重定向最多 5 跳）→ INFO
- 修复: 归一化后 `update-link`；非官网引导修正

### 7. 重复工具 — ERROR

- 方法: name 完全相同（忽略大小写）→ ERROR
- 方法: 归一化 url 相同 → ERROR
- 修复: 引导删除重复项（保留较早创建的）

### 8. URL 追踪参数 — WARN

- 判定: URL 含 utm_*、fbclid、gclid 等追踪参数 → WARN（后端归一化**不删**这些参数，会原样入库并进导出物）
- 判定: 域名含大写、有尾斜杠、带片段、带 `www.` 等未归一化形态 → WARN（正常不会出现，写入端已归一化；多为直连改库的脏行）
- 修复: 追踪参数手动去掉后 `update-link`；未归一化形态 `update-link` 重写即可触发后端归一化
- 归一化规则见 tool-collect.md 的 URL 归一化段

### 9. description 为空 — INFO

- 判定: null/空 → INFO
- 修复: 引导 `/std-enrich`

### 10. tags 为空 — INFO

- 判定: tags 数组长度 0 → INFO
- 修复: 引导 `/std-enrich`

### 11. name 正确性 — WARN

- 判定: name 拼写错误（如 "Chat GPT"→应 "ChatGPT"，"DJ"→应 "D-ID"）→ WARN

### 12. description 正确性 — WARN

- 判定: description 与实际不符 → WARN

### 13. 主题归属正确性 — WARN

- 判定: topic_ids 为空 → WARN（建议归属主题）
- 判定: topic_ids 非空但主题与工具功能不匹配 → WARN

### 14. pricing 正确性 — WARN

- 判定: pricing 不在 free / freemium / paid 内 → ERROR
- 判定: pricing 值与实际不符 → WARN

### 15. origin / access / languages 合法性 — WARN

- 判定: origin 不在 cn / overseas 内 → ERROR
- 判定: access 不在 direct / proxy 内 → ERROR
- 判定: languages 为空、超过 8 项或有重复 → ERROR
- 判定: languages 含非 ISO 639-1 两字母小写值 → ERROR

### 16. tags 正确性 — WARN

- 判定: tags 存在但与工具不贴切 → WARN
- 判定: tags 超过 8 个或有重复 → ERROR

## 输出格式

按级别分组，每条含: 工具(名称+id) / 问题 / 建议

```
=== ERROR (2) ===
T1 (id=1)           links 为空                          添加工具链接
某工具 (id=88)      name 含 HTML 标签残留               清洗为纯文本

=== WARN (1) ===
ChatGPT (id=40)     slug=item-a3f2 与名称不对应          重新生成 slug

=== INFO (3) ===
Claude (id=38)      description 为空                    建议补全
Claude (id=38)      tags 为空                           建议补全
...
```

## 修复策略

| 问题                | 可自动修 | 方法                   |
| ------------------- | -------- | ---------------------- |
| name 含残留符号     | 是       | 清洗 + update          |
| name 拼写错误       | 半       | 询用户确认后 update    |
| slug 不对应         | 是       | 重新生成 + update      |
| tagline 缺标点      | 是       | 补标点 + update        |
| links 空            | 否       | 引导人工               |
| URL 格式错          | 否       | 引导修正               |
| URL 追踪参数        | 是       | 去参 + update-link     |
| URL 非官网          | 否       | 引导修正               |
| 重复                | 是       | 删除重复项（保留较早） |
| pricing 非法/不符   | 半       | 询用户核实后 update    |
| origin/access 非法  | 半       | 询用户核实后 update    |
| languages 非法      | 半       | 询用户核实后 update    |
| 主题空/归属错       | 半       | 建议主题，询用户确认   |
| description 空/不符 | 否       | 引导 enrich            |
| tags 空/不贴切      | 否       | 引导 enrich            |
