# 产品信息补全 Prompt

## 补全规则

根据产品名称和已有信息，补全缺失字段：

### description

- 根据产品名生成一句话描述（30-80 字）
- 描述产品的核心功能和用途
- 示例: "OpenAI 推出的 AI 对话助手，支持文本生成、代码编写、问答等"

### category_id

- 查询现有分类列表
- 根据产品功能判断最合适的分类
- 如果不确定，列出候选分类询问用户
- 映射参考:
  - 对话类 → chat-assistant
  - 绘画类 → image-generation
  - 编程类 → code-tools
  - 写作类 → writing-tools
  - 视频类 → video-tools

### tags

- 生成 2-3 个标签
- 标签应描述产品的关键特征
- 示例: ["对话", "AI", "免费"]

### links

- 如果用户提供了 URL，添加为主链接
- 如果产品有 API 文档、GitHub 仓库等，可添加附加链接

### pricing

- 根据产品信息判断定价模式
- 不确定时默认 free，询问用户确认
