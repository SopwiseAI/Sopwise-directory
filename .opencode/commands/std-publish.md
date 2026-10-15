---
description: 发布工具（status → 已发布，自动处理状态转换）
---

# 发布工具

要发布的工具 ID: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 执行步骤

1. 如果用户未提供 ID，先列出待审核工具:

   ```
   !`python skills/tools/api.py tools --status pending --page-size 100`
   ```

   请用户选择要发布的 ID。

2. 查看工具详情确认当前状态:

   ```
   python skills/tools/api.py tool <工具ID>
   ```

3. 根据返回数据的 `status` 字段决定操作路径（先判合法性，非法直接提示不调接口）:

   - **status=pending (待审核)** → 检查必要项后直接发布:
     先确认名称非空、tagline 以标点结尾、links 至少有一条 `status=active` 链接，然后:

     ```
     python skills/tools/api.py --yes update-tool <工具ID> --status published
     ```

   - **status=draft (草稿)** → 需两步，**必须串行**执行，第二步依赖第一步成功（draft→published 跳步会被后端 409 拒绝）:
     先检查必要项（名称、tagline、至少一条 `status=active` 链接），缺则告知用户先用 `/std-enrich` 补全:

     ```
     python skills/tools/api.py --yes update-tool <工具ID> --status pending
     python skills/tools/api.py --yes update-tool <工具ID> --status published
     ```

     两条命令不能合并成一次调用；第一步没成功就不要执行第二步。

   - **status=archived (已下架)** → 直接重新发布 (archived→published 合法):

     ```
     python skills/tools/api.py --yes update-tool <工具ID> --status published
     ```

   - **status=published (已发布)** → 告知用户该工具已是发布状态，无需操作

   非法迁移（如 draft→published 跳步）后端返回 409，CLI 会打印错误并退出。

4. 告知用户工具已发布，published_at 已自动记录
