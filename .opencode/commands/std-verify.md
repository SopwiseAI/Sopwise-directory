---
description: 数据正确性校对（全量扫描，输出问题清单+修复建议）
---

# 数据校对

校对范围: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

校对已写入数据的正确性，输出问题清单与修复建议。与 `/std-enrich`（补缺失）、`/std-review`（状态门）互补: verify 判已有数据对不对。

## 默认范围

- 默认扫**所有状态** (draft/pending/published/archived) 的工具
- 可用 `--status <值>` 收窄到特定状态

## 执行步骤

1. 概览:

   ```
   !`python skills/tools/api.py stats`
   ```

2. 取全量工具（分页拉取；`tools` 默认只回 20 条、`--page-size` 上限 100；CLI 不打印响应头，
   总条数只在表格尾部以 `(共 N 条)` 显示，按它判断要翻到第几页）:

   ```
   python skills/tools/api.py tools --page 1 --page-size 100
   python skills/tools/api.py tools --page 2 --page-size 100
   ```

3. 逐工具检查。级别（ERROR / WARN / INFO）与判定条目**一律**以 `skills/prompts/tool-verify.md`
   为准（**必须先读**），本文件不重复其清单; 这里只固定检查顺序:

   name → slug → tagline → links/URL → 重复工具 → URL 追踪参数 → 主题归属 → pricing →
   origin/access/languages → description → tags

4. 输出问题清单（级别分组与排序以 `skills/prompts/tool-verify.md` 的输出格式为准）。工具用
   「名称 + 当前 ID」标识，不要写死示例 ID; 定位工具用 `python skills/tools/api.py tools --search <关键字>`:

   ```
   工具                     问题                     级别   建议
   <工具名>(id=<ID>)        links 为空               ERROR  添加工具链接
   <工具名>(id=<ID>)        name 含 HTML 标签残留    ERROR  清洗为纯文本
   <工具名>(id=<ID>)        description 为空         INFO   建议补全
   ```

5. 对可自动修复项（如 slug 不对应、name 含残留符号）询问用户是否执行修复:

   ```
   python skills/tools/api.py --yes update-tool <ID> --name "清洗后名称"
   ```

   修复先 dry-run 预览

6. 不可自动修复项给出人工指引

7. 汇总: 检查 N 个、发现问题 K 个（ERROR a/WARN b/INFO c）、已修复 M 个
