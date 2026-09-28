# 产品信息补全 Prompt

## 补全规则

根据产品名称和已有信息，补全缺失字段。**只补缺失字段，不覆盖已有有效值**。

### description

- 根据产品名 + URL 抓取页面信息生成一句话描述（30-80 字）
- 描述产品的核心功能和用途
- 中立客观，不使用营销话术
- 示例: "OpenAI 推出的 AI 对话助手，支持文本生成、代码编写、问答等"

### category_id

- 查询现有分类列表: `python skills/tools/api.py categories --json`
- 根据产品功能判断最合适的分类
- 如果不确定，列出候选分类询问用户
- 映射参考（按库内实际分类，非穷举）:
  - 对话类 → chat-assistant
  - 绘画类 → image-generation
  - 编程类 → code-tools
  - 写作类 → writing-tools
  - 视频类 → video-tools
  - 其他见库内分类列表

### tags

- 生成 2-3 个标签，描述产品关键特征
- 标签须同时生成 slug: 英文转小写连字符，中文用拼音或英文翻译
- 示例: [{name:"对话", slug:"chat"}, {name:"AI", slug:"ai"}, {name:"免费", slug:"free"}]
- 设置标签前必须先读现有标签: `python skills/tools/api.py product-tags <ID>`
- set-tags 是全量替换，传入**现有标签 ID + 新标签 ID** 完整列表

### links

- 用户提供的 URL 添加为主链接（is_primary=true）
- **URL 入库前必须归一化**（去 utm_* 等追踪参数、补 scheme、域名小写、去尾斜杠，详见 product-collect.md 的 URL 归一化段）
- 如产品有 API 文档、GitHub 仓库等，可添加附加链接（is_primary=false）
- 添加前检查 links 数组是否已有相同归一化 URL，避免重复

### pricing

- 根据产品信息判断定价模式: free / freemium / paid / opensource
- 不确定时默认 free，询问用户确认
- 已有有效值时不覆盖
