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

- 默认扫**所有状态** (status=0,1,2,3) 的产品
- 可用 `--status N` 收窄到特定状态

## 执行步骤

1. 概览:

   ```
   !`python skills/tools/api.py stats`
   ```

2. fetch 全量产品（分页拉取）

3. 逐产品逐项检查（清单见 `skills/prompts/product-verify.md`）:

   | 检查项            | 级别  | 判定                          |
   | ----------------- | ----- | ----------------------------- |
   | name 空/异常      | ERROR | 非空、无拼写错、用官方名      |
   | slug 与 name 对应 | WARN  | 中文 name 应有拼音/英文 slug  |
   | links 空          | ERROR | 至少1条                       |
   | URL 格式          | ERROR | 合法 http(s)://               |
   | URL 可达          | INFO  | HEAD 请求，超时不作错         |
   | 重复产品          | ERROR | 跨库查 name/url 重复          |
   | category_id 空    | WARN  | 建议归属分类                  |
   | pricing 合法      | WARN  | free/freemium/paid/opensource |
   | description 空    | INFO  | 建议补                        |
   | tags 空           | INFO  | 建议补                        |

4. 输出问题清单（按级别排序: ERROR > WARN > INFO）:

   ```
   产品                问题                          级别   建议
   P1(id=1)           links 为空                    ERROR  添加产品链接
   P1(id=1)           slug=p1 与名称对应            -      通过
   某工具(id=88)       name 含 HTML 标签残留         ERROR  清洗为纯文本
   ChatGPT(id=40)     description 为空               INFO   建议补全
   ```

5. 对可自动修复项（如 slug 不对应、name 含残留符号）询问用户是否执行修复:

   ```
   !`python skills/tools/api.py --yes update-product <ID> --name "清洗后名称"`
   ```

   修复先 dry-run 预览

6. 不可自动修复项给出人工指引

7. 汇总: 检查 N 个、发现问题 K 个（ERROR a/WARN b/INFO c）、已修复 M 个
