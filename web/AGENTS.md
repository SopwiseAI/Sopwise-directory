<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# XiGee Directory — AI 产品发现引擎

## 项目概述

XiGee Directory 是一个 AI 产品发现引擎，帮助用户发现和浏览各类 AI 产品。MVP 阶段为纯前端 SSG 站点，基于 data.json 驱动数据。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (base-nova-style, neutral base)
- fuse.js (客户端模糊搜索)
- lucide-react (图标)
- pnpm

## 开发命令

```bash
pnpm dev      # 启动开发服务器
pnpm build    # 构建生产版本
pnpm start    # 启动生产服务器
pnpm lint     # 运行 ESLint
```

## 目录结构

```
app/                    # Next.js App Router 页面
├── page.tsx            # 首页 (SSG)
├── layout.tsx          # 根布局
├── category/[id]/      # 分类页 (SSG, generateStaticParams)
├── search/             # 搜索页 (CSR)
├── sitemap.ts          # 动态 sitemap
├── robots.ts           # robots.txt
components/
├── ui/                 # shadcn/ui 组件
├── layout/             # Header, Footer, ThemeToggle
├── product/            # ProductCard, ProductGrid
├── category/           # CategoryIcon, CategoryNav
├── search/             # SearchBar, SearchResults
lib/
├── types.ts            # TypeScript 类型定义
├── data.ts             # 数据读取工具函数
├── search.ts           # fuse.js 搜索配置
├── utils.ts            # shadcn/ui cn() 工具
data/
├── data.json           # 产品数据（分类 + 产品列表）
```

## 数据模型

### 分类 (Category)

id: string, name: string, icon: string (lucide-react icon name)

### 产品 (Product)

id: string, name: string, description: string, url: string, categoryId: string, tags?: string[], icon?: string, pricing?: "free"|"freemium"|"paid"|"opensource", featured?: boolean, createdAt: string

## 关键约定

- 页面组件为 Server Component，交互组件标记 "use client"
- Next.js 16 中 params 是 Promise，必须 await 后使用
- 搜索使用 useSearchParams() + Suspense 边界
- 产品卡片点击直接跳转外部网站，无详情页
- 数据更新：修改 data/data.json → 提交 PR → 合并 → Vercel 自动部署
