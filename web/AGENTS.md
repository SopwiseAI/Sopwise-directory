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
- 外壳 chrome（主区顶栏 `MainHeader`、移动端顶栏 `Header`、分类条 `SubNav`、`Footer`）同样走
  `pageShell("browse")`：**底色/分隔线通栏，内容与 `main` 同宽**。不要在这里写 `max-w-*` 或干脆
  不加宽度容器 —— 顶栏若铺满主区两侧，宽屏下会与居中的正文错开（实测 1920px 偏 180px、
  2560px 偏 500px），整页看着像两套栅格
- 控件一律用 `components/ui/` 的组件 + 变体（`Button variant="outline"`、`ToggleGroup variant="outline"`…），
  不要手写 `inline-flex h-8 rounded-md border px-2.5 …` 这类与变体等价的类名：全站曾出现
  `toolbarControl`、`iconButton` 等 4 份复制品，改一次圆角要改四处
- 空状态一律用 `Empty`（含"筛选/搜索无结果"，不要另写虚线框 div）；加载占位用 `Skeleton`
- 信息页（设置/关于/隐私/条款）宽容器下每个小节切成「标签 13rem + 内容 1fr」，内容列铺到
  页框右边缘：既不留下一条结构性空白，行宽也由列宽自然控制在每行 64 字左右 ——
  不要给正文单独加 `max-w-*` 收窄（那是把空白换了个位置）
- 设置类「一行一个设置」用 shadcn `Field`：`FieldGroup` + `Field orientation="responsive"`
  （标题+说明在左、控件在右，窄容器自动堆叠）；列表/键值行用 `Item`；键帽用 `Kbd`。
  不要「卡片里再套一层带边框的控件卡片」—— 两层方框是之前的主要观感问题
- 多选项控件用 `ToggleGroup` + `spacing={0}` 连成一个分段控件（不要排成一堆独立方框）；
  行列数用容器查询（`@container` + `@2xl:` 等）跟随实际宽度，不要用视口断点 ——
  主区可用宽度会被侧栏折叠/展开改变；列数要与选项数对齐，每组都排满整行、不留空格子
- 页面控制栏统一用 `components/layout/page-bar.tsx`（二级栏）：`h-11` + 下边框 + 左切换器 /
  右辅助控件 + 桌面吸附在顶栏之下。各页放什么由页面决定（信息页放页面导航、首页放筛选与
  排序/视图、历史页放搜索与筛选），但形态必须一致：
  - **永远单行 `h-11`**：切换器横向滚动（自带右缘渐隐提示），辅助控件钉在右侧；不要折行 ——
    折行后手机上会出现 83/111px 高的"栏"，就不是栏了
  - 栏内控件高度对齐 `h-8`（`Button` 默认尺寸、`InputGroup`、`FilterSelect`、
    `ToggleGroup size="default"` 都是 h-8）。注意 **`Button size="sm"` 是 h-7**，比它们矮一档 ——
    历史页的「清除筛选 / 清空全部」现在就是 h-7，属已知档位差异；要严格同高就用默认尺寸。
    输入类控件**定宽**（`sm:w-72` 之类），不要 `flex-1` 撑满整条栏
  - **底色通栏、下边框随内容宽度**：底色铺满主区（吸顶时两侧不漏内容），分隔线收在内容
    容器上 —— 否则信息页（正文 6xl）的下划线会比正文两边各多出 40px，看着"超长"
  - 栏与顶栏/正文之间**要留白**（用外壳 main 的上内边距与调用方下边距），不要抵消上内边距
    去"紧贴顶栏" —— 试过，观感逼仄
- 二级栏里的切换器沿用全站既有语言（选中态 `bg-brand/10 text-brand` 胶囊）：短切换器与
  产品筛选、信息导航、移动端分类条共用同一套样式；长列表导航（>8 项横向滚动）不要改下边线
- 移动端信息页不显示分类条（`SubNav` 内按 `isInfoRoute()` 提前返回），避免两条横栏叠在顶栏下
- 产品卡片点击直接跳转外部网站，无详情页
- 数据更新：修改 `data/data.json` → PR → 合并 → Vercel 自动部署

## CI

`.github/workflows/web-ci.yml`：push/PR 时执行 `lint → typecheck → test → build`。
