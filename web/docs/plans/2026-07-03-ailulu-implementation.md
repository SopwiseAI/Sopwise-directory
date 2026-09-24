# ailulu 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 构建 ailulu AI 产品书签网站 MVP，纯前端 SSG 站点，基于 data.json 驱动

**Architecture:** Next.js 16 App Router SSG，构建时从 data.json 读取数据生成静态页面。客户端使用 fuse.js 搜索，@tanstack/react-virtual 虚拟滚动。shadcn/ui 组件库 + Tailwind CSS 4 样式。部署 Vercel。

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, @tanstack/react-virtual, fuse.js, pnpm

---

### Task 1: 项目基础设施搭建

**Files:**
- Modify: `package.json`
- Create: `data/data.json`
- Create: `lib/types.ts`
- Create: `lib/data.ts`

**Step 1: 安装核心依赖**

Run:
```bash
pnpm add @tanstack/react-virtual fuse.js lucide-react
```

**Step 2: 安装 shadcn/ui**

Run:
```bash
npx shadcn@latest init -d --template next
```

这会创建 `components.json`、`lib/utils.ts`、并配置好 Tailwind CSS 变量。选择默认配置（new-york style、neutral base color、css variables）。

**Step 3: 添加 shadcn/ui 组件**

Run:
```bash
npx shadcn@latest add button badge input card separator
```

**Step 4: 创建 TypeScript 类型定义**

Create `lib/types.ts`:
```typescript
export type Pricing = "free" | "freemium" | "paid" | "opensource";

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  url: string;
  categoryId: string;
  tags?: string[];
  icon?: string;
  pricing?: Pricing;
  featured?: boolean;
  createdAt: string;
}

export interface SiteData {
  categories: Category[];
  products: Product[];
}
```

**Step 5: 创建初始 data.json**

Create `data/data.json`，包含 10 个分类和至少 20 个 AI 产品示例数据（覆盖每个分类至少 2 个产品）。示例产品包括 ChatGPT、Claude、Midjourney、GitHub Copilot、Jasper、Runway、ElevenLabs、Notion AI、Tableau AI、Figma AI、Duolingo 等。

**Step 6: 创建数据读取工具函数**

Create `lib/data.ts`:
```typescript
import data from "@/data/data.json";
import type { Category, Product, SiteData } from "./types";

const siteData = data as SiteData;

export function getAllCategories(): Category[] {
  return siteData.categories;
}

export function getCategoryById(id: string): Category | undefined {
  return siteData.categories.find((c) => c.id === id);
}

export function getAllProducts(): Product[] {
  return siteData.products;
}

export function getFeaturedProducts(): Product[] {
  return siteData.products.filter((p) => p.featured);
}

export function getLatestProducts(limit?: number): Product[] {
  const sorted = [...siteData.products].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  return limit ? sorted.slice(0, limit) : sorted;
}

export function getProductsByCategory(categoryId: string): Product[] {
  return siteData.products.filter((p) => p.categoryId === categoryId);
}

export function getProductById(id: string): Product | undefined {
  return siteData.products.find((p) => p.id === id);
}
```

**Step 7: 验证构建**

Run:
```bash
pnpm build
```

Expected: 构建成功

**Step 8: 提交**

```bash
git add -A
git commit -m "feat: scaffold project infrastructure with types, data, and dependencies"
```

---

### Task 2: 布局组件 — Header 和 Footer

**Files:**
- Create: `components/layout/header.tsx`
- Create: `components/layout/footer.tsx`
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

**Step 1: 创建 Header 组件**

Create `components/layout/header.tsx`:
- Logo（ailulu 文字标识）
- 桌面端分类导航链接（水平排列）
- 搜索图标按钮（移动端点击展开搜索框）
- 响应式设计：移动端汉堡菜单
- 使用 shadcn/ui Button 组件
- 使用 lucide-react 图标（Search、Menu、X）
- sticky 顶部固定

**Step 2: 创建 Footer 组件**

Create `components/layout/footer.tsx`:
- 版权信息 "© 2026 ailulu"
- "提交产品" 链接（MVP 阶段指向 GitHub repo）
- 简洁两行布局

**Step 3: 更新 Root Layout**

Modify `app/layout.tsx`:
- 导入 Header 和 Footer
- metadata 更新：title "ailulu - AI 产品书签"，description "发现和探索最好的 AI 产品"
- lang 改为 "zh-CN"
- 包裹 Header + main + Footer

**Step 4: 更新 globals.css**

Modify `app/globals.css`:
- 确保保留 shadcn/ui init 生成的 CSS 变量
- 添加必要的自定义样式

**Step 5: 验证开发服务器**

Run:
```bash
pnpm dev
```

Expected: 页面显示 Header 和 Footer

**Step 6: 提交**

```bash
git add -A
git commit -m "feat: add Header and Footer layout components"
```

---

### Task 3: 产品卡片组件

**Files:**
- Create: `components/product/product-card.tsx`

**Step 1: 创建 ProductCard 组件**

Create `components/product/product-card.tsx`:
- 接收 `Product` 类型 props
- 整个卡片为可点击区域，链接到 `product.url`，target="_blank"，rel="noopener noreferrer"
- 布局：产品图标（48x48 圆角正方形，有 fallback 占位符）+ 产品名称 + 描述（line-clamp-2）+ 标签（Badge）+ 定价标识
- 使用 shadcn/ui Card 和 Badge 组件
- hover 效果：轻微上浮 + 阴影
- 定价标识颜色：free=绿色, freemium=蓝色, paid=橙色, opensource=紫色
- 响应式

**Step 2: 在首页临时测试**

在 `app/page.tsx` 中临时引入 ProductCard 并传入一条测试数据，确认渲染效果。

**Step 3: 验证开发服务器**

Run:
```bash
pnpm dev
```

Expected: 看到产品卡片

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add ProductCard component"
```

---

### Task 4: 产品网格（含虚拟滚动）

**Files:**
- Create: `components/product/product-grid.tsx`

**Step 1: 创建 ProductGrid 组件**

Create `components/product/product-grid.tsx`:
- "use client" 客户端组件
- 接收 `products: Product[]` props
- 使用 @tanstack/react-virtual 实现虚拟滚动
- 网格布局：响应式 1/2/3/4 列
- 每行渲染 N 个 ProductCard（根据屏幕宽度计算列数）
- 固定行高，虚拟滚动只渲染可见行
- 底部留有 padding 确保最后一行可见

**Step 2: 临时测试**

在 `app/page.tsx` 中用 `getAllProducts()` 数据渲染 ProductGrid，确认虚拟滚动工作正常。

**Step 3: 验证开发服务器**

Run:
```bash
pnpm dev
```

Expected: 产品列表以网格形式展示，滚动时虚拟滚动正常工作

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add ProductGrid with virtual scrolling"
```

---

### Task 5: 分类导航组件

**Files:**
- Create: `components/category/category-icon.tsx`
- Create: `components/category/category-nav.tsx`

**Step 1: 创建 CategoryIcon 组件**

Create `components/category/category-icon.tsx`:
- 接收 iconName string，映射到 lucide-react 图标组件
- 映射表：MessageSquare, Image, Code, PenTool, Video, Music, Zap, BarChart, Palette, GraduationCap 等
- 返回对应图标组件

**Step 2: 创建 CategoryNav 组件**

Create `components/category/category-nav.tsx`:
- 接收 `categories: Category[]` 和可选 `activeId?: string` props
- 网格布局展示分类：图标 + 分类名称
- 每个分类链接到 `/category/[id]`
- activeId 匹配时高亮显示
- 响应式：移动端 5 列、桌面端 5 列或 10 列

**Step 3: 验证开发服务器**

Run:
```bash
pnpm dev
```

**Step 4: 提交**

```bash
git add -A
git commit -m "feat: add CategoryIcon and CategoryNav components"
```

---

### Task 6: 搜索功能

**Files:**
- Create: `lib/search.ts`
- Create: `components/search/search-bar.tsx`
- Create: `components/search/search-results.tsx`
- Create: `app/search/page.tsx`

**Step 1: 创建搜索配置**

Create `lib/search.ts`:
```typescript
import Fuse from "fuse.js";
import type { Product } from "./types";

export function createSearchIndex(products: Product[]): Fuse<Product> {
  return new Fuse(products, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.3 },
    ],
    threshold: 0.4,
    includeScore: true,
  });
}
```

**Step 2: 创建 SearchBar 组件**

Create `components/search/search-bar.tsx`:
- "use client"
- 使用 shadcn/ui Input 组件
- 搜索图标前缀
- 输入防抖（300ms）
- 回车或点击搜索图标跳转到 `/search?q=关键词`
- 支持 defaultValue（从 URL 参数读取）

**Step 3: 创建 SearchResults 组件**

Create `components/search/search-results.tsx`:
- "use client"
- 读取 URL searchParams 中的 q 参数
- 使用 createSearchIndex + fuse.js 搜索
- 渲染搜索结果为 ProductGrid
- 无结果时显示空状态

**Step 4: 创建搜索页**

Create `app/search/page.tsx`:
- SSG 页面，但搜索结果部分为 CSR（SearchResults 组件）
- 页面顶部大搜索框
- 搜索结果区域
- generateMetadata 设置 title 包含搜索关键词

**Step 5: 验证搜索功能**

Run:
```bash
pnpm dev
```

在搜索框输入关键词，确认搜索结果正常显示。

**Step 6: 提交**

```bash
git add -A
git commit -m "feat: add search functionality with fuse.js"
```

---

### Task 7: 首页实现

**Files:**
- Modify: `app/page.tsx`

**Step 1: 实现首页**

Modify `app/page.tsx`:
- Server Component
- Hero 区域：大标题 "发现最好的 AI 产品" + 副标题 + SearchBar
- 精选推荐区域：getFeaturedProducts() 渲染产品卡片（普通网格，不做虚拟滚动）
- 分类入口区域：CategoryNav 组件
- 最新收录区域：getLatestProducts() + ProductGrid（虚拟滚动）
- 使用 getAllCategories() 传递分类数据

**Step 2: 验证首页**

Run:
```bash
pnpm dev
```

Expected: 完整首页渲染，包含所有区域

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement homepage with hero, featured, categories, and latest"
```

---

### Task 8: 分类页实现

**Files:**
- Create: `app/category/[id]/page.tsx`

**Step 1: 创建分类页**

Create `app/category/[id]/page.tsx`:
- Server Component
- generateStaticParams：从 getAllCategories() 生成所有分类的静态路径
- generateMetadata：分类名称 + " - ailulu"
- 读取 categoryId，使用 getCategoryById() 和 getProductsByCategory()
- 顶部：分类名称 + 图标 + 产品数量
- CategoryNav（传入 activeId）
- ProductGrid（虚拟滚动）
- 分类不存在时 notFound()

**Step 2: 验证分类页**

Run:
```bash
pnpm dev
```

访问 `/category/chat-assistant`，确认分类页正常渲染。

**Step 3: 提交**

```bash
git add -A
git commit -m "feat: implement category page with SSG and virtual scrolling"
```

---

### Task 9: SEO 和元数据优化

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

**Step 1: 更新根 Layout metadata**

Modify `app/layout.tsx`:
- 完善 metadata：title template、description、keywords
- openGraph 配置
- 添加 viewport 配置

**Step 2: 创建 sitemap**

Create `app/sitemap.ts`:
- generateStaticParams 模式
- 包含首页 + 所有分类页的 URL
- lastModified 使用当前日期

**Step 3: 创建 robots.txt**

Create `app/robots.ts`:
- 允许所有爬虫
- 指向 sitemap

**Step 4: 验证构建**

Run:
```bash
pnpm build
```

Expected: 构建成功，生成的静态页面包含正确的 metadata

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add SEO optimization with sitemap, robots, and metadata"
```

---

### Task 10: 暗色模式与样式优化

**Files:**
- Modify: `app/globals.css`
- Modify: `components/layout/header.tsx`

**Step 1: 确认暗色模式变量**

确认 `app/globals.css` 中 shadcn/ui 生成的 dark mode CSS 变量正确。

**Step 2: 添加暗色模式切换**

在 Header 中添加主题切换按钮（Sun/Moon 图标）：
- "use client" 单独提取为 ThemeToggle 客户端组件
- 使用 localStorage 存储偏好
- 切换 html 元素的 class

**Step 3: 样式微调**

- 确保所有组件在暗色模式下显示正常
- 产品卡片间距、字体大小统一
- 响应式断点测试

**Step 4: 验证**

Run:
```bash
pnpm dev
```

切换暗色模式，确认所有组件显示正常。

**Step 5: 提交**

```bash
git add -A
git commit -m "feat: add dark mode toggle and style refinements"
```

---

### Task 11: 构建验证与部署准备

**Files:**
- Modify: `next.config.ts`
- Modify: `.gitignore`

**Step 1: 更新 next.config.ts**

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
```

注意：如果使用 `output: "export"` 纯静态导出，需确认所有功能兼容。如果 Vercel 部署则不需要此配置，Vercel 原生支持 SSG。

**Step 2: 运行 lint**

Run:
```bash
pnpm lint
```

修复所有 lint 错误。

**Step 3: 运行构建**

Run:
```bash
pnpm build
```

Expected: 构建成功，无错误

**Step 4: 验证构建产物**

Run:
```bash
pnpm start
```

访问所有页面，确认功能正常。

**Step 5: 提交**

```bash
git add -A
git commit -m "chore: build verification and deployment preparation"
```

---

### Task 12: AGENTS.md 更新

**Files:**
- Modify: `AGENTS.md`

**Step 1: 更新 AGENTS.md**

在现有内容之后添加项目特定信息：
- 项目概述
- 技术栈
- 开发命令（dev、build、lint）
- 目录结构说明
- 数据模型说明
- 关键约定

**Step 2: 提交**

```bash
git add -A
git commit -m "docs: update AGENTS.md with project conventions"
```

---

## 实施顺序总结

| Task | 内容 | 预估时间 |
|------|------|----------|
| 1 | 项目基础设施搭建 | 15min |
| 2 | Header + Footer 布局 | 15min |
| 3 | ProductCard 组件 | 10min |
| 4 | ProductGrid 虚拟滚动 | 15min |
| 5 | 分类导航组件 | 10min |
| 6 | 搜索功能 | 20min |
| 7 | 首页实现 | 15min |
| 8 | 分类页实现 | 15min |
| 9 | SEO 优化 | 10min |
| 10 | 暗色模式与样式 | 15min |
| 11 | 构建验证 | 10min |
| 12 | AGENTS.md 更新 | 5min |

**总计预估：约 2.5 小时**
