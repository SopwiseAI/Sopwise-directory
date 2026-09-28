<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# XiGee Directory — AI 产品发现引擎

## 项目概述

XiGee Directory 是一个 AI 产品发现引擎，帮助用户发现和浏览各类 AI 产品。当前阶段为纯前端 SSG 站点，基于 `data/data.json` 驱动数据，部署于 Vercel。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (base-nova style, neutral base)
- fuse.js（客户端模糊搜索）
- lucide-react（图标）
- Vitest + Testing Library（单元测试）
- pnpm 10 + Node 22

## 开发命令

```bash
pnpm dev          # 启动开发服务器 (http://localhost:3000)
pnpm build        # 构建生产版本
pnpm start        # 启动生产服务器
pnpm lint         # 运行 ESLint
pnpm typecheck    # TypeScript 类型检查 (tsc --noEmit)
pnpm test         # 运行测试 (vitest run)
pnpm test:watch   # 测试监听模式
pnpm analyze      # 分析构建产物体积 (ANALYZE=true)
```

## 环境变量

| 变量                   | 说明                              | 默认值                  |
| ---------------------- | --------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL（sitemap / robots / OG） | `https://www.xigee.net` |

参考 `.env.example`。

## 目录结构

```
app/                            # Next.js App Router
├── page.tsx                    # 首页 (SSG)
├── layout.tsx                  # 根布局 (字体 / 主题 / 全局壳 / JSON-LD)
├── loading.tsx                 # 路由级骨架屏
├── error.tsx                   # 全局错误边界
├── not-found.tsx               # 404 页
├── category/[id]/page.tsx      # 分类页 (SSG, generateStaticParams)
├── search/page.tsx             # 搜索页 (CSR, useSearchParams + Suspense)
├── history/page.tsx            # 历史记录页 (CSR, localStorage)
├── settings/page.tsx           # 设置页 (主题 / 统计 / 关于)
├── manifest.ts                 # PWA Web Manifest
├── sitemap.ts                  # 动态 sitemap
├── robots.ts                   # robots.txt
├── opengraph-image.tsx         # 动态 OG 图
├── globals.css                 # 全局样式 + 设计 token (Tailwind 4)
├── icon.svg                    # favicon
└── apple-icon.png              # Apple touch icon

components/
├── ui/                         # shadcn/ui 基础组件 (button / badge / tooltip)
├── layout/                     # 全局布局件
│   ├── header.tsx              #   移动端顶栏
│   ├── sub-nav.tsx             #   移动端分类横滚条
│   ├── command-search-bar.tsx  #   桌面端搜索条 (/ 快捷键)
│   ├── footer.tsx              #   页脚
│   ├── brand-mark.tsx          #   品牌 SVG
│   ├── brand-showcase.tsx      #   首页 hero
│   ├── theme-toggle.tsx        #   主题循环切换按钮
│   ├── theme-switch.tsx        #   设置页主题卡片
│   ├── history-tracker.tsx     #   全局历史记录捕获
│   ├── panel-icon.tsx          #   侧栏折叠图标
│   └── web-vitals.tsx          #   Web Vitals 上报
├── product/                    # 产品展示
│   ├── product-browser.tsx     #   列表容器 (tab / 排序 / 视图切换)
│   ├── product-toolbar.tsx     #   工具条
│   ├── product-card.tsx        #   网格卡片
│   ├── product-row.tsx         #   列表行
│   └── pricing-badge.tsx       #   价格徽章
├── category/
│   └── category-sidebar.tsx    #   桌面端分类侧栏 (可折叠)
├── search/
│   └── search-results.tsx      #   搜索结果列表
└── history/
    ├── history-list.tsx        #   历史记录主体 (无限滚动 / 搜索 / 删除)
    └── history-count.tsx       #   侧栏历史角标

lib/
├── types.ts                    # TypeScript 类型定义
├── data.ts                     # 数据读取 (import data.json, server 端)
├── product-utils.ts            # 产品工具 (getProductDate / productHistoryAttrs)
├── search.ts                   # fuse.js 搜索配置
├── format.ts                   # 格式化 (formatCount / formatDate)
├── history.ts                  # localStorage 历史管理
├── url.ts                      # URL 工具 (getDomain)
├── category-icon-node.tsx      # 分类图标 (lucide 动态映射)
├── utils.ts                    # cn() + getBaseUrl
├── format.test.ts              # 测试
├── product-utils.test.ts       # 测试
├── search.test.ts              # 测试
└── url.test.ts                 # 测试

data/
└── data.json                   # 产品数据 (分类 + 产品列表)
```

## 数据模型

### 分类 (Category)

```ts
interface Category {
  id: string // slug, 如 "chat-assistant"
  name: string // 显示名, 如 "对话助手"
  icon: string // lucide-react 图标名, 如 "MessageSquare"
}
```

### 产品 (Product)

```ts
interface Product {
  id: string
  name: string
  description: string
  url: string // 外部官网链接
  categoryId: string // 关联 Category.id
  tags?: string[]
  icon?: string // 保留字段, 当前未使用
  pricing?: "free" | "freemium" | "paid" | "opensource"
  featured?: boolean
  publishedAt?: string // ISO 日期, 优先于 createdAt
  createdAt?: string // ISO 日期
}
```

## 数据流

```
data/data.json
  ↓ import (resolveJsonModule)
lib/data.ts (server 端读取, 模块单例)
  ↓ props 传入
app/ 页面 (Server Component, SSG 构建时渲染)
  ↓ 序列化为 HTML
client 组件 (props 接收数据, 不直接 import data.ts)
```

关键约定：client 组件不直接 `import data.json`，由 Server Component 父级通过 props 传入，避免 data.json 全量内联 client bundle。

## 关键约定

- 页面组件为 Server Component，交互组件标记 `"use client"`
- Next.js 16 中 `params` 是 Promise，必须 `await` 后使用
- `useSearchParams()` 必须包裹 `<Suspense>` 边界
- 产品卡片点击直接跳转外部网站，无详情页
- 产品状态流程：草稿 → 待审核 → 已发布 → 已下架（仅已发布导出到前端）
- 数据更新：修改 `data/data.json` → 提交 PR → 合并 → Vercel 自动部署

## SEO 与 PWA

- `sitemap.ts` — lastModified 取 data.json 中产品最大 createdAt
- `robots.ts` — Allow `/`，Disallow `/search` `/history`
- `manifest.ts` — PWA Web Manifest（scope / icons / theme_color）
- JSON-LD — 首页 `WebSite + SearchAction`，分类页 `BreadcrumbList + ItemList`
- `opengraph-image.tsx` — 运行时生成 OG 图

## 安全配置

`next.config.ts` 设置以下响应头：

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## CI

`.github/workflows/web-ci.yml` 在 push/PR 时执行：

```
lint → typecheck → test → build
```

使用 `.nvmrc` 锁定的 Node 版本，`pnpm install --frozen-lockfile` 安装依赖。
