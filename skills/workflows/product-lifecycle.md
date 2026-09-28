# 产品生命周期工作流

## 完整流程

```
0a. 采集 (/std-collect)
    → 混乱数据(文本/网页/列表/JSON/CSV) → 批量草稿 (status=0)
    → 仅写 name+url，分类/标签/描述交给后续 enrich

0b. 校对 (/std-verify)
    → 扫描所有状态产品 → 问题清单 → 可自动修项修复

1. 添加产品 (/std-add-product)
   → 单条创建为草稿 (status=0)
   → AI 自动判断分类、生成 slug

2. 补全信息 (/std-enrich)
   → AI 补全 description、tags、links
   → 仍为草稿 (status=0)

3. 提交审核 (/std-submit)
   → 校验必填(名+链接) → 进入待审核 (status=1)

4. 审核 (/std-review)
   → 通过: status=2 (已发布), published_at 自动写入
   → 打回: status=0 (草稿), 回到步骤 2

5. 导出数据 (/std-export)
   → 仅 status=2 的产品导出到 web/data/data.json + data-{env}.json
   → 提交代码 → Vercel 自动部署

6. 下架/重新发布 (/std-archive)
   → 下架 2→3, 重新发布 3→2
   → 已下架产品不导出
```

辅助管理:

- `/std-manage-category` 分类 CRUD 闭环
- `/std-manage-tag` 标签 CRUD 闭环

## 状态转换矩阵

| 从 \ 到  | 0 草稿 | 1 待审核 | 2 已发布   | 3 已下架 |
| -------- | ------ | -------- | ---------- | -------- |
| 0 草稿   | -      | ✓ 提交   | -          | -        |
| 1 待审核 | ✓ 打回 | -        | ✓ 通过     | -        |
| 2 已发布 | -      | -        | -          | ✓ 下架   |
| 3 已下架 | -      | -        | ✓ 重新发布 | -        |

> 草稿(0) 不能直接发布(2)，必须先提交审核(0→1)再通过(1→2)。

## 注意事项

- `published_at` 仅在首次 status→2 时写入，之后不变
- 导出仅包含 status=2 的产品
- 分类产品计数仅统计 status=2
- 删除产品会级联删除其链接和标签关联
