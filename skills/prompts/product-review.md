# 产品审核 Prompt

## 审核标准

对每个待审核产品（status=1），按以下标准审核:

### 必须项（不满足则打回）

1. **产品名称** — 非空，无拼写错误，使用官方名称；不含 HTML 标签或装饰符
2. **链接** — links 数组至少1条；主链接（is_primary=true）须存在且指向产品官网
3. **slug** — 与名称对应且 URL 友好；中文 name 应有拼音/英文 slug，不可为 `item-xxxx` fallback

### 建议项（不满足可通过但提示）

4. **分类** — category_id 非空，归属合理
5. **定价** — pricing 为 free/freemium/paid/opensource 之一
6. **描述** — description 非空（允许为空，但建议补全）

### 审核结论

- **通过**: 所有必要项满足 → status=2（已发布）
- **打回**: 必要项缺失 → status=0（草稿），附具体打回原因

### 输出格式

```
审核结果:
  ✅ 产品名: ChatGPT (id=40)
     - 名称: ✓ 官方名称
     - 链接: ✓ https://chat.openai.com (主链接)
     - slug: ✓ chatgpt
     - 分类: ✓ 对话助手
     - 定价: ✓ freemium
     - 描述: ✓ AI 对话助手
     → 通过，已发布

  ❌ 产品名: 某工具 (id=88)
     - 名称: ✓
     - 链接: ✗ 无链接
     → 打回，原因: 缺少产品链接
```
