# 产品生命周期工作流

## 完整流程

```
1. 采集 (/std-collect)
   → 混乱数据(文本/网页/列表/JSON/CSV) → 批量草稿 (status=0)
   → 仅写 name+url，分类/标签/描述交给后续步骤

2. 补全 (/std-enrich)
   → AI 补全 description、tags、links、category_id
   → 仍为草稿 (status=0)

3. 提交审核 (/std-submit)
   → 校验必填(名+链接) → 进入待审核 (status=1)

4. 审核 (/std-review)
   → 通过: status=2 (已发布), published_at 首次写入
   → 打回: status=0 (草稿)，回到步骤 2 补全

5. 发布 (/std-publish)
   → 草稿两步发布 (0→1→2)
   → 已下架重新发布 (3→2)
   → published_at 仅首次→2 写入

6. 导出 (/std-export)
   → 仅 status=2 的产品导出到 web/data/data.json + data-{env}.json
   → 提交代码 → Vercel 自动部署

7. 下架/重新发布 (/std-archive)
   → 下架 2→3, 重新发布 3→2
   → 已下架产品不导出
```

### 横切动作（随时可调用）

```
/std-verify        全量校对，查有无+对错，出问题清单
/std-list          按状态/搜索列出产品
/std-stats         目录总览统计
```

## 辅助管理

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
- 分类产品计数（category-count）仅统计 status=2，但**删除分类时后端拦截统计所有状态产品**，即 count=0 不保证可删（可能有未发布产品关联）
- 删除产品会级联删除其链接和标签关联

## 生产环境保护

后端环境为 prod 时，所有写操作强制门槛:

- 写操作必须显式 `--yes`，否则拒绝 (exit 3)
- DELETE 操作额外必须 `--prod-confirm`，否则拒绝 (exit 3)
- 日志醒目记录 `PROD 写操作`

**模型如何知晓后端环境**: 所有命令前置检查都调 `api.py health`，该命令输出含 `env` 字段并在 prod 时显示醒目警示行。模型读到警示后主动带 `--yes`/`--prod-confirm`；若仍遗漏，`_write` 层强制拒绝兜底。

模型在 prod 执行命令前应: 优先 dry-run 预览、写操作带 `--yes`、删除带 `--prod-confirm`、状态变更需用户明确指令。
