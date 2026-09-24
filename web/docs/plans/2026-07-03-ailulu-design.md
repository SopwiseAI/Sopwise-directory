# ailulu — AI 产品书签网站设计文档

## 概述

ailulu 是一个 AI 产品书签网站（C端），帮助用户发现和浏览各类 AI 产品。MVP 阶段为纯静态前端网站，基于 data.json 驱动，部署在 Vercel。

## 技术栈

- **框架**：Next.js 16 (App Router) + React 19
- **样式**：Tailwind CSS 4
- **组件库**：shadcn/ui
- **虚拟滚动**：@tanstack/react-virtual
- **搜索**：fuse.js（客户端模糊搜索）
- **部署**：Vercel（SSG 静态生成）
- **包管理**：pnpm

## 架构方案：静态生成 + data.json

- 构建时从 `data/data.json` 读取产品数据，生成静态页面
- 数据更新通过 Git 提交触发 Vercel 重新构建
- 产品卡片点击直接跳转外部网站，无详情页
- 搜索在客户端通过 fuse.js 实现

## 数据模型

### categories（分类）

```json
{
  "id": "chat-assistant",
  "name": "对话助手",
  "icon": "MessageSquare"
}
```

### products（产品）

```json
{
  "id": "chatgpt",
  "name": "ChatGPT",
  "description": "OpenAI 推出的 AI 对话助手",
  "url": "https://chat.openai.com",
  "categoryId": "chat-assistant",
  "tags": ["免费", "对话", "GPT-4"],
  "icon": "https://example.com/chatgpt-icon.png",
  "pricing": "freemium",
  "featured": true,
  "createdAt": "2024-01-01"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 唯一标识，用于 URL slug |
| name | string | 是 | 产品名称 |
| description | string | 是 | 产品描述 |
| url | string | 是 | 产品官网链接 |
| categoryId | string | 是 | 关联分类 ID |
| tags | string[] | 否 | 多维度标签 |
| icon | string | 否 | 产品图标 URL |
| pricing | enum | 否 | free/freemium/paid/opensource |
| featured | boolean | 否 | 是否首页推荐 |
| createdAt | string | 是 | 收录日期 |

### 初始分类

1. 对话助手 (chat-assistant)
2. 图像生成 (image-generation)
3. 代码工具 (code-tools)
4. 写作工具 (writing-tools)
5. 视频工具 (video-tools)
6. 音频工具 (audio-tools)
7. 效率工具 (productivity)
8. 数据分析 (data-analysis)
9. 设计工具 (design-tools)
10. 教育学习 (education)

## 页面结构

### 路由

| 路由 | 页面 | 渲染方式 | 说明 |
|------|------|----------|------|
| `/` | 首页 | SSG | 精选推荐 + 分类导航 + 最新收录 + 搜索 |
| `/category/[id]` | 分类页 | SSG | 按功能分类浏览产品列表 |
| `/search` | 搜索结果页 | CSR | fuse.js 客户端搜索 |

### 首页布局

```
┌─────────────────────────────────────┐
│  Header: Logo + 搜索框 + 分类导航    │
├─────────────────────────────────────┤
│  Hero: 标题 + 副标题 + 搜索框        │
├─────────────────────────────────────┤
│  精选推荐: featured 产品卡片         │
├─────────────────────────────────────┤
│  分类入口: 10 个分类图标网格         │
├─────────────────────────────────────┤
│  最新收录: 虚拟滚动产品列表          │
├─────────────────────────────────────┤
│  Footer: 版权 + 提交产品入口         │
└─────────────────────────────────────┘
```

### 产品卡片

- 产品图标（圆角正方形）
- 产品名称
- 简短描述（2行截断）
- 标签
- 定价标识
- 点击卡片直接跳转产品官网

## 目录结构

```
app/
├── layout.tsx
├── page.tsx
├── category/
│   └── [id]/
│       └── page.tsx
├── search/
│   └── page.tsx
components/
├── ui/
├── layout/
│   ├── header.tsx
│   └── footer.tsx
├── product/
│   ├── product-card.tsx
│   └── product-grid.tsx
├── category/
│   ├── category-nav.tsx
│   └── category-icon.tsx
├── search/
│   ├── search-bar.tsx
│   └── search-results.tsx
lib/
├── data.ts
├── types.ts
├── search.ts
data/
├── data.json
```

## 虚拟滚动

- 使用 @tanstack/react-virtual
- 应用于首页「最新收录」和分类页产品列表
- 固定行高，优化渲染性能

## 搜索

- fuse.js 客户端模糊搜索
- 搜索字段：name、description、tags
- 搜索结果页为 CSR（"use client"）

## 样式规范

- 配色：中性色为主，卡片白色/浅色背景
- 响应式：移动端单列、平板双列、桌面三列/四列
- 暗色模式：Tailwind dark: 支持
- 产品图标：统一圆角正方形

## 数据抓取与审核流程

```
抓取脚本(外部) → 生成 data.json 变更 → 提交 PR → 人工审核 → 合并 → Vercel 自动部署
```

MVP 阶段先手动维护 data.json，抓取脚本后续迭代。

## 用户体系

MVP 阶段无需登录，纯浏览模式。

## 决策记录

| 决策 | 选择 | 原因 |
|------|------|------|
| 架构 | SSG + data.json | 最简单、SEO 最佳、与审核流程契合 |
| 组件库 | shadcn/ui | 高度可定制，与 Tailwind 完美搭配 |
| 搜索 | fuse.js | 轻量、支持中文、无后端依赖 |
| 虚拟滚动 | @tanstack/react-virtual | React 生态标准方案 |
| 详情页 | 不做 | 书签性质，点击直接跳转 |
| 部署 | Vercel | Next.js 最佳搭档 |
