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

2. fetch 全量工具（分页拉取；列表接口返回裸数组，总数在响应头 `X-Total-Count`，
   `page_size` 上限 100）

   ```
   python skills/tools/api.py tools --page 1 --page-size 100
   python skills/tools/api.py tools --page 2 --page-size 100
   ```

3. 逐工具逐项检查（清单见 `skills/prompts/tool-verify.md`）:

   | 检查项             | 级别  | 判定                         |
   | ------------------ | ----- | ---------------------------- |
   | name 空/异常       | ERROR | 非空、无拼写错、用官方名     |
   | slug 与 name 对应  | WARN  | 中文 name 应有拼音/英文 slug |
   | links 空           | ERROR | 至少 1 条                    |
   | URL 格式           | ERROR | 合法 http(s)://              |
   | URL 可达           | INFO  | HEAD 请求，超时不作错        |
   | 重复工具           | ERROR | 跨库查 name/url 重复         |
   | topic_ids 空       | WARN  | 建议归属主题                 |
   | tagline 空/无标点  | ERROR | 非空且以标点结尾             |
   | pricing 合法       | WARN  | free/freemium/paid           |
   | origin/access 合法 | WARN  | cn/overseas、direct/proxy    |
   | languages 合法     | WARN  | 1~8 项 ISO 639-1 两字母小写  |
   | description 空     | INFO  | 建议补                       |
   | tags 空            | INFO  | 建议补                       |

4. 输出问题清单（按级别排序: ERROR > WARN > INFO）:

   ```
   工具                问题                          级别   建议
   T1(id=1)           links 为空                    ERROR  添加工具链接
   T1(id=1)           slug=p1 与名称对应            -      通过
   某工具(id=88)      name 含 HTML 标签残留         ERROR  清洗为纯文本
   ChatGPT(id=40)     description 为空               INFO   建议补全
   ```

5. 对可自动修复项（如 slug 不对应、name 含残留符号）询问用户是否执行修复:

   ```
   python skills/tools/api.py --yes update-tool <ID> --name "清洗后名称"
   ```

   修复先 dry-run 预览

6. 不可自动修复项给出人工指引

7. 汇总: 检查 N 个、发现问题 K 个（ERROR a/WARN b/INFO c）、已修复 M 个
