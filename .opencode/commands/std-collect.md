---
description: 采集批量产品入库为草稿（支持文本/网页/列表/JSON/CSV文件）
---

# 采集产品

采集输入: $ARGUMENTS

## 前置检查

```
!`python skills/tools/api.py health`
```

## 你的任务

从混乱的输入数据中提取产品候选，清洗去重后批量入库为草稿（status=0）。**最小化入库**：只写 name + url + slug，分类/标签/描述交给后续 `/std-enrich` 补全。

## 输入识别（自动判别类型）

按以下特征判定输入属于哪种解析器，处理详情见 `skills/prompts/product-collect.md`:

| 输入特征                                | 解析器        | 处理                                                                                                           |
| --------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------- |
| 单个 `http(s)://` URL                   | 网页抓取      | 调用 agent-browser skill 抓取页面，**由 LLM 根据页面内容生成规范化产品名（不直接用网页 title）**，URL 作为链接 |
| 多行/含 `,` `\t` `;` 分隔               | 列表/CSV 解析 | 逐行 split，首列 name 次列 url；含表头行自动跳过                                                               |
| `{` 或 `[` 开头                         | JSON 解析     | 按 name/url 字段映射                                                                                           |
| 以 `.csv`/`.json`/`.txt` 结尾的文件路径 | 文件读取      | 读取内容后按扩展名选上述解析器                                                                                 |
| 其他文本                                | 文本抽取      | LLM 从文本提取候选产品名+URL 列表                                                                              |

## 执行步骤

1. 识别输入类型，选用对应解析器提取候选列表
2. 逐条清洗（规则见 product-collect.md）:
   - URL 归一化（去 utm_* 参数、补 https、去尾斜杠）
   - name 清洗（去空格/HTML 残留/多余符号）
   - slug 生成（英文小写连字符；中文→拼音/英文翻译；中文 name 必须生成有效 slug）
3. 去重:
   - 跨条去重: name 完全相同、或 url 完全相同，保留首条
   - 查库内已有: `products` 全量比对，已存在的标记"重复"跳过
4. 输出**预览表**:

   ```
   #   名称          URL                              Slug            状态
   1   ChatGPT       https://chat.openai.com          chatgpt         新增
   2   Claude        https://claude.ai                claude          新增
   3   (重复)X       https://x.com                    x               重复-跳过
   ```

5. 分批控制:
   - 默认每批 20 条，上限 500（批量由本工作流控制，无 `--limit` 参数）
   - 候选数超过当前 limit 时，**提示用户分批操作**: 告知总数、建议批次划分、询问是否处理当前批次或调整 limit
   - **文件输入数据量较大时**: 读取后汇报总行数，按 limit 切批，逐批预览确认

6. 逐条入库（仅 name + url + slug）:

   ```
   !`python skills/tools/api.py add-product --name "产品名" --slug "生成slug" --url "https://..."`
   ```

   单条失败不中断，记录失败原因继续下一条

7. 汇总:

   ```
   采集结果:
     新增: N 条
     跳过(重复): M 条
     失败: K 条
       - [行3] 名称缺失
       - [行7] URL 格式无效
   ```

8. 引导: 新增产品均为草稿，可用 `/std-enrich` 补全信息、`/std-verify` 校对正确性

## 网页抓取规范

输入为单个 URL 时:

1. 调用 agent-browser skill: `agent-browser open <url> && agent-browser wait --load networkidle && agent-browser snapshot -i`
2. 从快照提取页面核心信息（标题、描述、h1、meta description）
3. **LLM 生成产品名**: 综合页面信息，按"品牌名 + 产品定位"或"官方名称"规范生成，不直接用 `<title>`
4. URL 作为产品链接
5. 抓取失败时降级: 入失败清单，提示用户手动补 name

## 安全

- 默认 dry-run 预览，确认后才入库
- 批量入库用 `--op-id collect-{时间戳}` 串联幂等，避免误重跑
- 文件输入只读取，不修改源文件
