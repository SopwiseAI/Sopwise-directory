# 分类侧栏（Category Sidebar）设计文档

## 概述

将分类导航从第 2 条横向 SubNav 改为**桌面端全高、贴左边缘的 app-shell 左栏**（Codex / DeepSeek 风格），可展开/收起；移动端保留顶栏 Header + 横向 SubNav。核心目的：以真正的左右 app-shell 布局承载分类，而非把侧栏塞进居中容器、从 Header 下方开始。

## 决策记录（来自 brainstorming）

| 决策点 | 选择 | 理由 |
|---|---|---|
| 形态 | 全高、贴左、常驻 app-shell 左栏 | Codex/DeepSeek 风格；左右布局的关键就是全栏 |
| 顶栏拆分 | 品牌进 rail 顶、主题进 rail 底；搜索进内容区顶条；去掉全局顶栏 | Codex 风格：rail 承载品牌+导航+主题，内容区顶条承载搜索 |
| 默认状态 | 展开 + localStorage 记忆 | 新用户直观，老用户保持习惯 |
| 移动端 | 保留 Header（品牌+搜索+主题）+ 横向 SubNav | rail 隐藏，移动横向条本就合适 |
| 状态实现 | `useSyncExternalStore` + `storage` 事件 | 规避 React 19 `set-state-in-effect` lint；与 `theme-toggle.tsx` 同款 house pattern；SSR 默认展开避免水合不匹配 |

## 现状

- `app/layout.tsx`：`Header → SubNav → main → Footer`，单列居中 `max-w-6xl`。
- `components/layout/header.tsx`：粘性 `top-0`、全宽、`h-14`，含品牌"ailulu"+ 搜索 + 主题切换 + 移动搜索按钮。
- `components/layout/sub-nav.tsx`：粘性 `top-14`，横向滚动分类条（"全部" + 20 分类），已加 `md:hidden`（Task2）。
- `components/category/category-sidebar.tsx`：Task1 已建，含 `useSyncExternalStore` 收起/记忆逻辑与 `SidebarLink`（已通过 spec + 代码质量评审）。旧容器为 `sticky top-14 … md:flex`（塞在居中容器内），需重写为全高 rail。
- `components/category/category-icon.tsx`：已映射 20 个 lucide 图标。

## 目标布局（`app/layout.tsx`，app-shell）

```
<body className="min-h-full flex flex-col">
  <Header className="md:hidden" />              // 移动顶栏(品牌+搜索+主题)，桌面隐藏
  <SubNav className="md:hidden" />              // 移动横向分类，桌面隐藏
  <div className="flex flex-1">
    <CategorySidebar />                         // 桌面全高贴左 rail (hidden md:flex)
    <div className="flex min-w-0 flex-1 flex-col">
      <ContentSearchBar />                      // 桌面内容区顶搜索条 (hidden md:block, sticky top-0)
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  </div>
  <Footer />
</body>
```

- 桌面：rail 贴左顶到底（`sticky top-0 h-[100dvh]`）；右侧内容列 = 顶部搜索条 + main。
- 移动：Header + SubNav + main + Footer（同现状）。
- 内容区宽度仍 `max-w-6xl`（如需更宽后续再调）。

## 组件

### `components/category/category-sidebar.tsx`（重写为全高 rail）

- 容器：`sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r bg-background md:flex`，宽度 `w-52`（展开）/ `w-14`（收起），`transition-[width] duration-200`。
- 顶部品牌行 `h-14`：`<Link>ailulu</Link>`（展开显示，收起 `sr-only`）+ 收起按钮（图标 only，`PanelLeftClose` 展开 / `PanelLeftOpen` 收起）。
- 中部 `<nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">`：复用 `SidebarLink` + "全部"（`LayoutGrid` 图标）+ 20 分类（`CategoryIcon`）。
- 底部 `border-t p-2`：`<ThemeToggle />`（收起居中、展开左对齐）。
- **保留** Task1 的 `useSyncExternalStore` 收起/记忆逻辑、`SidebarLink`、空 catch 用真实语句（`return false` / `return`）。
- 收起态：链接 `title` 提供 tooltip，名称 `sr-only`；按钮 `aria-expanded`/`aria-controls="category-sidebar"`。

### 新建 `components/layout/content-search-bar.tsx`（桌面搜索条）

- `"use client"` + `Suspense`（`useSearchParams`）；受控输入 + Enter → `/search?q=`；复用 `Input`、`Search` 图标。
- 根：`hidden md:block sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`。
- 内层：`mx-auto max-w-6xl px-4 sm:px-6 py-2`，输入框 `max-w-md`（与 main 对齐）。
- 移动端隐藏（移动搜索由 Header 承担）。与 Header 内部输入有少量重复，符合现仓库习惯。

### `components/layout/header.tsx`

- 加 `className?: string`，透传到 `<header>` 并用 `cn` 合并；布局里 `<Header className="md:hidden" />`。其余不动。

### `components/layout/sub-nav.tsx`

- 已在 Task2 改 `md:hidden`，无需再动。

## 复用 / 重写

- 复用：Task1 的 `useSyncExternalStore` 收起逻辑、`SidebarLink`、`CategoryIcon`、`ThemeToggle`、`getAllCategories`、`Input`。
- 重写：`category-sidebar.tsx` 外壳（全高 + 品牌 + 主题）、`layout.tsx`（app-shell）。
- 新增：`content-search-bar.tsx`、Header 的 className 透传。

## 不改动范围

`page.tsx`、`category/[id]/page.tsx`、`data.json`、ProductList、ProductRow、Footer、SubNav 内部、ThemeToggle 内部、搜索页。

## 风险

- 内容区变窄：刻意取舍，可后续提到 `max-w-7xl`。
- 收起用户首帧闪烁：`useSyncExternalStore` SSR 默认展开，挂载后应用记忆值；轻微，可接受。
- 搜索输入逻辑与 Header 重复：约 15 行，可后续抽公共 `SearchInput`。
- 移动端无变化：保持 Header + SubNav，预期之内。
