# ailulu Design System — Console Redesign

> 整合 Codex app-shell 布局语言 + DeepSeek Harness 视觉质感，保持「AI 产品书签站」本质不变。

## 设计原则

1. **数据即界面**：数量、价格、分类、状态用等宽字体（Geist Mono）呈现，传递"控制台/仪表"感。
2. **分层表面（Elevation）**：深色模式下用炭黑分层代替纯黑：`bg → surface → elevated`，配合 1px 细边框定义层次，避免扁平模板感。
3. **简约即高级**：克制装饰，拒绝"AI 花活"——无网格背景、无光晕、无发光指示条、无渐变文字、无呼吸动画。视觉自信来自留白、细边框、克制的色彩层次与一致的间距节奏。
4. **一屏一主**：每个页面有且只有一个主角（首页=精选卡片区，分类页=产品列表）。
5. **克制动效**：仅 hover/focus 的颜色与边框过渡，无位移、无阴影弹跳。

## 色彩（深色优先分层）

| Token                            | 浅色                     | 深色                     | 用途                   |
| -------------------------------- | ------------------------ | ------------------------ | ---------------------- |
| `--background`                   | `oklch(0.99 0.002 240)`  | `oklch(0.145 0 0)`       | 页面底                 |
| `--card`                         | 白                       | `oklch(0.185 0.002 240)` | 卡片面（高于背景一档） |
| `--popover`                      | 白                       | `oklch(0.21 0.003 240)`  | 浮层/弹层（再高一档）  |
| `--sidebar`                      | `oklch(0.975 0.002 240)` | `oklch(0.165 0.002 240)` | 侧栏面（低于主区一档） |
| `--border`                       | 浅灰                     | `oklch(1 0 0 / 10%)`     | 1px 分隔               |
| `--primary`                      | 深石墨                   | `oklch(0.922 0 0)`       | 主操作/活跃态文字      |
| `--accent`（保留 shadcn accent） | 浅灰                     | `oklch(0.269 0 0)`       | 悬浮面                 |
| `--muted-foreground`             | `oklch(0.556 0 0)`       | `oklch(0.708 0 0)`       | 次级文字               |
| 状态绿                           | `oklch(0.584 0.14 155)`  | `oklch(0.68 0.15 155)`   | 状态点/成功            |

> 保持 oklch 体系（shadcn new-york neutral 基础色不变），仅微调分层与透明度。
> 所有组件禁裸用 tailwind 色板（slate/gray），一律走 token。

## 等宽字体（Data Type）

- `--font-mono`（Geist Mono）用于：统计数字、价格徽标、版本号、快捷键 kbd、URL、分类计数。
- 规则：`font-mono text-[11px] tabular-nums` 风格的单项数字。

## 价格徽标（Status Badge）

价格以"状态徽章"呈现，mono 小字 + 语义色（保留原配色语义，改用 token 化透明底）：

| Pricing    | 语义色 |
| ---------- | ------ |
| free       | 绿     |
| freemium   | 蓝     |
| paid       | 橙     |
| opensource | 紫     |

## 布局（Codex app-shell）

```
┌────────┬──────────────────────────────┐
│ Sidebar│ CommandBar（sticky，⌘/ 聚焦）│
│  品牌块 │ ──────────────────────────── │
│  分类列表│  页面内容（max-w-6xl）        │
│  计数徽标│    hero/工具栏/卡片网格       │
│  ────  │                             │
│  设置   │                             │
│  主题   │                             │
└────────┴──────────────────────────────┘
```

- 桌面：固定侧栏（可折叠 52px）+ 独立滚动内容列；移动端：顶栏 + 横向分类条。
- 侧栏活跃项：左侧 2px 指示条 + 文字高亮；未活跃：muted 文字。
- 分类项右侧：mono 计数徽标（产品数）。

## 组件结构

```
components/
├── layout/
│   ├── command-search-bar.tsx   # 统一搜索（/ 快捷键、kbd 提示）
│   ├── brand-block.tsx          # 侧栏品牌块：logo + 状态点 + 版本
│   ├── status-dot.tsx           # 绿色脉冲状态点
│   └── footer.tsx
├── product/
│   ├── product-card.tsx         # 卡片模式
│   ├── product-row.tsx          # 列表模式（mono 徽标）
│   ├── product-toolbar.tsx      # 视图切换 / 排序 / 计数
│   └── product-icon.tsx         # favicon 提取 + 首字母回退
```

## 页面

| 页面             | 主角       | 组成                                                |
| ---------------- | ---------- | --------------------------------------------------- |
| `/`              | 精选卡片区 | hero（品牌+统计条）+ 精选卡片 + 最新收录 + 分类速览 |
| `/category/[id]` | 产品列表   | 分类头（icon+名+计数+最近更新）+ 工具栏 + 列表/卡片 |
| `/search`        | 搜索结果   | 命令式结果 + 计数 + 建议                            |
| `/settings`      | 外观与统计 | 主题段 + 数据统计段（mono 数字）                    |

## 交互细节

- `/` 聚焦搜索（全站，非输入态时）；`t` 切换主题；`Esc` 关闭/失焦。
- kbd 组件：等宽 + 边框底阴影，模拟键帽。
- focus-visible 统一 `ring-2 ring-ring ring-offset-2 ring-offset-background`。
- 卡片 hover：轻微上浮（`-translate-y-0.5`）+ 边框高亮 + 阴影。
- 状态点：CSS 动画呼吸圈（respect prefers-reduced-motion）。

## 数据补强（已实施）

- 产品 icon：`lib/product-icon.ts` 从 `product.url` 提取域名，用 icon.horse（Cloudflare 托管）favicon 服务，失败回退首字母。
- **数据扩充**：新增 29 个真实产品，覆盖原 10 个空分类（营销/翻译/研究/自动化/客服/3D/法律/金融/医疗/游戏），产品总数 56 → 85，全部分类非空。
- 侧栏/分类页计数：`getProductsByCategory().length` 静态计算。
- 「最新收录」：按 `createdAt` 降序取前 N。

## 可访问性

- 所有文本对比度 ≥ 4.5:1（常规）/ 3:1（大文本），深色模式 muted 用 0.708 亮度。
- 半透明背景上只用高对比文本。
- 动效遵循 `prefers-reduced-motion`。
- 键盘可达：侧栏链接、工具栏按钮、搜索全部可 Tab 聚焦并有可见焦点环。

## 验收标准

- `pnpm build` 通过；`pnpm lint` 通过。
- 深/浅双主题下 chromium 截图无溢出、无对比度问题。
- 移动端（<768px）无横滚，功能完整（顶栏搜索 + 横向分类条）。
