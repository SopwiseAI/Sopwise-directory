# Sopwise Directory

AI 产品书签导航站 — 发现和浏览精选的 AI 工具与应用。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 + shadcn/ui (base-nova-style, neutral base)
- fuse.js (客户端模糊搜索)
- lucide-react (图标)
- pnpm

## 快速开始

```bash
pnpm install   # 安装依赖
pnpm dev       # 启动开发服务器 (http://localhost:3000)
pnpm build     # 构建生产版本
pnpm start     # 启动生产服务器
pnpm lint      # 运行 ESLint
```

## 环境变量

| 变量                   | 说明                              | 默认值                |
| ---------------------- | --------------------------------- | --------------------- |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL（用于 sitemap / robots） | `https://sopwise.com` |

## 目录结构

```
app/            # Next.js App Router 页面
components/     # UI 组件 (layout / product / category / search / ui)
lib/            # 工具函数与类型定义
data/           # 产品数据 (data.json)
```

## 数据更新

修改 `data/data.json` → 提交 PR → 合并 → Vercel 自动部署。
