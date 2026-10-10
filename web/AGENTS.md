<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# XiGee Directory — AI 产品发现引擎

## 项目概述

纯前端 SSG 站点，基于 `data/data.json` 驱动数据，部署于 Vercel。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (base-nova, neutral)
- fuse.js（客户端模糊搜索）、lucide-react（图标）
- Vitest + Testing Library（单元测试）
- pnpm 10 + Node 22

## 开发命令

```bash
pnpm dev          # 开发服务器 (http://localhost:3000)
pnpm build        # 构建生产版本
pnpm start        # 生产服务器
pnpm lint         # ESLint
pnpm typecheck    # 类型检查
pnpm test         # 测试
pnpm analyze      # 分析构建产物体积
```

## 环境变量

| 变量                            | 说明                              | 默认值                  |
| ------------------------------- | --------------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL`          | 站点 URL (sitemap/robots)         | `https://www.xigee.net` |
| `NEXT_PUBLIC_STORAGE_PREFIX`    | 本地存储 key 前缀（变更会丢历史） | `xigee`                 |
| `NEXT_PUBLIC_HISTORY_MAX_ITEMS` | 单用户历史记录上限                | `500`                   |
| `NEXT_PUBLIC_SEARCH_THRESHOLD`  | 模糊搜索灵敏度 (0-1，越小越精确)  | `0.3`                   |

## 目录约定

```
app/          # App Router 页面 + 路由级元数据 (sitemap/robots/manifest/og)
components/   # UI 组件 (ui/layout/product/category/search/history)
lib/          # 工具函数与类型 (data 读取只在 server 端)
data/         # 产品数据 (data.json)
```

## 数据流

`data.json` → `lib/data.ts`（server 端 import）→ 页面 Server Component → props 传入 client 组件。client 组件不直接 import data.json，避免全量内联 bundle。

## 关键约定

- 页面为 Server Component，交互组件标记 `"use client"`
- Next.js 16 中 `params` 是 Promise，必须 `await`
- `useSearchParams()` 须包裹 `<Suspense>`
- 页面宽度统一走 `lib/layout.ts` 的 `PAGE_WIDTH` / `pageShell()`（浏览型 `max-w-7xl`、
  内容型 `max-w-6xl`），不要在页面里写 `max-w-*` 字面量
- 信息页（设置/关于/隐私/条款）宽容器下每个小节切成「标签 13rem + 内容 1fr」，内容列铺到
  页框右边缘：既不留下一条结构性空白，行宽也由列宽自然控制在每行 64 字左右 ——
  不要给正文单独加 `max-w-*` 收窄（那是把空白换了个位置）
- 控件栅格列数用容器查询（`@container` + `@2xl:` 等）跟随卡片实际宽度，不要用视口断点 ——
  主区可用宽度会被侧栏折叠/展开改变；列数要与选项数对齐，每组都排满整行、不留空格子
- 产品卡片点击直接跳转外部网站，无详情页
- 数据更新：修改 `data/data.json` → PR → 合并 → Vercel 自动部署

## CI

`.github/workflows/web-ci.yml`：push/PR 时执行 `lint → typecheck → test → build`。
