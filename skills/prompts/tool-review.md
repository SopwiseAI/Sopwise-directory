# 工具审核 Prompt

## 审核标准

对每个待审核工具（status=pending），按以下标准审核:

### 必须项（不满足则打回）

1. **工具名称** — 非空，无拼写错误，使用官方名称；不含 HTML 标签或装饰符
2. **tagline** — 非空且以标点结尾
3. **链接** — links 数组至少 1 条且 status=active；主链接（is_primary=true）须存在且指向工具官网；URL 不可达（HEAD 超时）应提示但非必须打回
4. **slug** — 与名称对应且 URL 友好；中文 name 应有拼音/英文 slug，不可为 `item-xxxx` fallback

### 建议项（不满足可通过但提示）

5. **主题归属** — topic_ids 非空，且主题与工具功能匹配（如编程工具不应归到绘画类）；主主题 primary_topic_id 已设置
6. **定价正确性** — pricing 为 free / freemium / paid 之一，且与实际相符（如标 free 但官网明示付费）
7. **地域/访问** — origin 为 cn / overseas，access 为 direct / proxy，且与实际相符
8. **语言** — languages 非空（1~8 项，ISO 639-1 两字母小写）
9. **描述正确性** — description 非空，且内容准确无错误；不含营销话术
10. **标签正确性** — tags 非空，且与工具特征贴切

### 审核原则

审核不仅看字段**有无**，更要校内容**对错**:

- 名称是否用官方名（"Chat GPT"→应"ChatGPT"）
- 主题归属是否合理
- 定价/地域/访问方式标注是否与实际一致
- 描述有无错误信息
- 标签是否贴切

### 审核结论

- **通过**: 所有必要项满足 → status=published（已发布）
- **打回**: 必要项缺失 → status=draft（草稿），附具体打回原因

### 输出格式

```
审核结果:
  ✅ 工具名: ChatGPT (id=40)
     - 名称: ✓ 官方名
     - tagline: ✓ 以标点结尾
     - 链接: ✓ https://chat.openai.com (主链接, 官网)
     - slug: ✓ chatgpt
     - 主题: ✓ 对话 (主主题已设)
     - 定价: ✓ freemium（与实际一致）
     - 描述: ✓ 准确无营销话术
     - 标签: ✓ 贴切
     → 通过，已发布

  ❌ 工具名: Chat GPT (id=88)
     - 名称: ✗ 拼写错误（应为 ChatGPT）
     - 链接: ✓
     - slug: ✓
     → 打回，原因: 名称非官方拼写

  ❌ 工具名: 某工具 (id=89)
     - 名称: ✓
     - tagline: ✗ 缺少句末标点
     - 链接: ✗ 无链接
     → 打回，原因: 缺少工具链接
```
