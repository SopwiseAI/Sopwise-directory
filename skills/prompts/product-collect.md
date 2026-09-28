# 产品采集 Prompt

## 解析器选择决策树

```
输入
 ├─ 以 http(s):// 开头且为单个 URL → 网页抓取解析器
 ├─ 以 .csv/.json/.txt 结尾 → 文件读取 + 按扩展名转发到对应解析器
 ├─ 以 { 或 [ 开头 → JSON 解析器
 ├─ 含换行且含分隔符(, \t ;) → 列表/CSV 解析器
 └─ 其他 → 文本抽取解析器
```

## 各解析器规则

### 网页抓取

- 调用 agent-browser skill 抓取页面
- **产品名生成（关键）**: 不直接用 `<title>`，综合 h1/meta description/页面可见文本，由 LLM 生成规范化名称:
  - 优先用品牌官方名（如 "Cursor"、"Notion"）
  - 品牌名不明确时用"品牌 + 定位"（如 "Adobe Firefly"）
  - 去掉无意义后缀（| 首页、- 官网等）
- **URL 经归一化后作为产品链接**（见下方"URL 归一化"），不直接用原始 URL

### 列表/CSV

- 逐行处理，跳过空行
- 分隔符优先级: `\t` > `,` > `;`
- 字段去引号包裹: `"name"` → `name`，`"url"` → `url`
- 首列作 name，次列作 url
- 检测表头行: 若首行含 "name"/"url"/"名称"/"链接" 视为表头跳过
- 单列时仅有 name，无 url

### JSON

- 对象数组: 提取每项的 name/url 字段
- 字段名兼容: name/names/title, url/link/website/homepage 均识别
- 嵌套: 若有 products 字段，进入取值
- 字段缺失处理: name 缺失 → 标记无效跳过；url 缺失 → 入库仅 name 无链接

### 文本抽取

- LLM 识别文本中的产品实体 + 对应 URL
- URL 可能是裸文本，需识别 `http(s)://` 模式
- 产品名可能中英文混合，按官方名规范
- 输出结构化候选列表

## 清洗规范

### URL 归一化

所有 URL（无论来自哪个解析器）入库前必须归一化:

1. **去追踪参数**: 删除 query 中所有 `utm_` 前缀参数、`fbclid`、`gclid`、`mc_eid`、`mc_cid`、`ref`、`srk`、`_hsenc`、`_hsmi`、`igshid`、`spm` 等
2. **补全 scheme**: 无 `http(s)://` 前缀时补 `https://`
3. **域名小写**: `WWW.Example.com` → `www.example.com`
4. **去默认端口**: `:443`(https) / `:80`(http) 删除
5. **去尾斜杠**: `example.com/` → `example.com`
6. **去片段**: 删除 `#` 及之后内容
7. **空 query 清理**: 去参后若 query 为空，删除 `?`

示例:

- `https://cursor.com/?utm_source=ad&gclid=xxx#top` → `https://cursor.com`
- `HTTP://WWW.NOTION.AI:443/` → `https://www.notion.ai`

### name 清洗

- 去前后空格
- 去 HTML 标签残留
- 去 emoji
- 去首尾标点/装饰符
- 合并连续空格为单空格

### slug 生成

- 英文: 转小写，空格转连字符，去非 `[a-z0-9-]` 字符
- 中文: 优先用官方英文名（如"通义千问"→`tongyi-qianwen` 无官方英文名则用拼音
- **不直接丢弃中文**: 中文 name 必须生成有效 slug，不可 fallback 到 `item-{随机}`
- 无法确定时: 询问用户指定，不要自动生成无意义 slug

## 去重判定

- **跨条去重**: name 完全相同（忽略大小写）或 **归一化后的 url** 完全相同，保留首条
- **查库**: `products` 全量，比对 name 和归一化 url 相同的标记"重复-跳过"

## 预览表格式

预览必须显示归一化后的 URL，让用户确认清洗效果:

```
#   名称          URL(归一化)                     Slug            状态
1   ChatGPT       https://chat.openai.com          chatgpt         新增
2   Claude        https://claude.ai                claude          新增
3   (重复)X       https://x.com                    x               重复-跳过
4   (无效)        (无URL)                         (无效)          失败-无URL
```

## 分批策略

- 默认 `--limit 20`，上限 500
- 候选数 > limit → 提示分批: 报总数、建议批次、询问处理范围
- 文件输入: 读取后报总行数，切批逐批预览确认
