# 工具信息补全 Prompt

## 补全规则

根据工具名称和已有信息，补全缺失字段。**只补缺失字段，不覆盖已有有效值**。

### description

- 根据工具名 + URL 抓取页面信息生成一句话描述（30-80 字）
- 描述工具的核心功能和用途
- 中立客观，不使用营销话术
- 示例: "OpenAI 推出的 AI 对话助手，支持文本生成、代码编写、问答等"

### tagline / origin / access / languages

这四个（加上 pricing）是后端必填字段，创建时应已填写；补全阶段只核对正确性，缺失或可疑时询问用户:

- `tagline`: 一句话简介，须以标点结尾
- `origin`: cn / overseas（开发与运营主体所在地区）
- `access`: direct / proxy（大陆网络环境下是否需要代理）
- `languages`: ISO 639-1 两字母小写，1~8 项

### topic_ids（主题归属）

- 查询现有主题列表: `python skills/tools/api.py topics --json`
- 根据工具功能判断最合适的主题
- 如果不确定，列出候选主题询问用户
- 映射参考（按库内实际主题，非穷举）:
  - 对话类 → chat
  - 绘画类 → image-generation
  - 编程类 → code-tools
  - 写作类 → writing-tools
  - 视频类 → video-tools
  - 其他见库内主题列表
- 设主主题时用 `--primary-topic-id`，它必须在 `--topic-ids` 里

### tags

- 生成 2-3 个标签，描述工具关键特征
- **标签是纯字符串数组**（不再有 name/slug 之分），最多 8 个，不能重复、不能为空、首尾不能有空白、单个最长 32 字符
- 示例: `["对话", "AI", "免费"]`
- 设置前必须先读现有标签: `python skills/tools/api.py tool-tags <ID>`
- `set-tags` 是全量替换，传入包含**现有标签 + 新标签**的完整列表:
  `python skills/tools/api.py --yes set-tags <ID> --tags "现有,新增"`

### links

- 用户提供的 URL 添加为主链接（is_primary=true）
- **URL 入库前必须归一化**（scheme 归一、域名小写、去 `www.`、去尾斜杠、去片段、query 排序等，详见 tool-collect.md 的 URL 归一化段）；归一化由后端写入端完成，**但后端不删 `utm_*` 等追踪参数**，需要时由调用方先清洗
- 如工具有 API 文档、GitHub 仓库等，可添加附加链接（is_primary=false），label 取 `docs` / `github` / `api` 等
- 添加前检查 links 数组是否已有相同归一化 URL，避免重复

### pricing

- 根据工具信息判断定价模式: free / freemium / paid
- **`opensource` 已从 pricing 移除**；是否开源是独立字段 `is_open_source`（布尔），两者正交
- 不确定时默认 free，询问用户确认
- 已有有效值时不覆盖
