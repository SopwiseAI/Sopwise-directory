# Sopwise Directory

你的 AI 发现引擎 — 精选各类 AI 工具与应用，按分类浏览或直接搜索你需要的能力。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (base-nova, neutral)
- fuse.js（客户端模糊搜索）、lucide-react（图标）
- Vitest + Testing Library（单元测试）
- pnpm 10 + Node 22

## 快速开始

```bash
pnpm install   # 安装依赖
pnpm dev       # 开发服务器 (http://localhost:3000)
pnpm build     # 构建生产版本
pnpm start     # 生产服务器
pnpm lint      # ESLint
pnpm typecheck # 类型检查
pnpm test      # 单元测试
```

## 环境变量

| 变量                   | 说明                      | 默认值                  |
| ---------------------- | ------------------------- | ----------------------- |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL (sitemap/robots) | `https://www.xigee.net` |

## 目录结构

```
app/          # App Router 页面 + 路由级元数据
components/   # UI 组件 (ui/layout/product/category/search/history)
lib/          # 工具函数与类型定义
data/         # 产品数据 (data.json)
```

## 数据更新

修改 `data/data.json` → 提交 PR → 合并 → Vercel 自动部署。
