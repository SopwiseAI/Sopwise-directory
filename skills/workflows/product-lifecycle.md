# 产品生命周期工作流

## 完整流程

```
1. 添加产品 (/std-add-product)
   → 创建为草稿 (status=0)
   → AI 自动判断分类、生成 slug

2. 补全信息 (/std-enrich)
   → AI 补全 description、tags、links
   → 仍为草稿 (status=0)

3. 提交审核 (/std-review 或手动 update-product --status 1)
   → 进入待审核 (status=1)

4. 审核 (/std-review)
   → 通过: status=2 (已发布), published_at 自动写入
   → 打回: status=0 (草稿), 回到步骤 2

5. 导出数据 (/std-export)
   → 仅 status=2 的产品导出到 web/data/data.json
   → 提交代码 → Vercel 自动部署

6. 下架 (手动 update-product --status 3)
   → 已下架产品不导出
   → 可重新发布 (status→2)
```

## 状态转换矩阵

| 从 \ 到  | 0 草稿 | 1 待审核 | 2 已发布   | 3 已下架 |
| -------- | ------ | -------- | ---------- | -------- |
| 0 草稿   | -      | ✓ 提交   | ✓ 直接发布 | -        |
| 1 待审核 | ✓ 打回 | -        | ✓ 通过     | -        |
| 2 已发布 | -      | -        | -          | ✓ 下架   |
| 3 已下架 | -      | -        | ✓ 重新发布 | -        |

## 注意事项

- `published_at` 仅在首次 status→2 时写入，之后不变
- 导出仅包含 status=2 的产品
- 分类产品计数仅统计 status=2
- 删除产品会级联删除其链接和标签关联
