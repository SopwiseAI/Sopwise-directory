# XiGee 品牌指南 — Brand Guidelines

> 版本：v1.0
> 最后更新：2026-09-24

---

## 1. 品牌概述

| 维度         | 定义                                          |
| ------------ | --------------------------------------------- |
| 品牌名称     | XiGee                                         |
| 品牌域名锁定 | XiGee**.net**                                 |
| 品牌调性     | 极简科技感、精准、高效                        |
| 产品定位     | AI 产品发现引擎 — 精选 AI 工具与应用导航      |
| 域名         | https://www.xigee.net/                        |
| 设计风格     | 几何图形 Logo、无衬线字体、锐利线条、暗色优先 |

### Slogan

| 场景                                  | Slogan                |
| ------------------------------------- | --------------------- |
| 首页 Hero / Meta Description / Footer | 你的 AI 发现引擎      |
| OG 图 / 英文环境                      | Find the AI you need. |

---

## 2. Logo 使用规范

### 2.1 Logo 设计概念

XiGee 的 Logo 以字母 "X" 为核心，通过两条对角线的精密交叉构成几何标识。右上角延伸出一个锐角三角形，形似指南针指针，暗示"发现方向"。整体传达精准与探索。

### 2.2 Logo 规格

| 属性     | 值                              |
| -------- | ------------------------------- |
| 图形     | 两条对角线交叉 + 右上锐角三角形 |
| viewBox  | 0 0 24 24                       |
| 线宽     | 2.4 (stroke-width)              |
| 线帽     | round                           |
| 背景     | 品牌色圆角方块（rounded-lg）    |
| 前景     | brand-foreground（白/浅色）     |
| 尺寸变体 | sm(24px) / md(32px) / lg(36px)  |

### 2.3 SVG 结构图

```svg
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
     stroke-linecap="round" stroke-linejoin="round">
  <path d="M5 5 L19 19" />
  <path d="M19 5 L12 12" />
  <path d="M14.5 5 L19 5 L19 9.5" />
</svg>
```

### 2.4 Favicon

64x64 SVG，背景 `#4d33b8`（品牌色浅色主题值），白色线条。

### 2.5 禁止事项

- 不要改变 Logo 的宽高比例
- 不要在 Logo 上添加阴影或发光效果
- 不要使用非品牌色作为 Logo 背景
- 不要在浅色背景上使用浅色 Logo（对比度不足）
- 不要旋转 Logo

---

## 3. 色彩规范

### 3.1 品牌点缀色

| 变量                 | 浅色主题               | 深色主题               | 用途                |
| -------------------- | ---------------------- | ---------------------- | ------------------- |
| `--brand`            | `oklch(0.55 0.20 265)` | `oklch(0.65 0.18 265)` | Logo 背景、链接强调 |
| `--brand-foreground` | `oklch(0.985 0 0)`     | `oklch(0.985 0 0)`     | 品牌色上的文字      |

色相 265（indigo/violet），与中性灰调（色相 240-250）区分但和谐。

### 3.2 中性色主体（保持不变）

浅色主题背景层级：`--background: oklch(0.978 0.003 240)` → `--card: oklch(1 0 0)` → `--popover: oklch(1 0 0)`

深色主题背景层级：`--background: oklch(0.145 0.005 245)` → `--sidebar: oklch(0.165 0.006 245)` → `--card: oklch(0.19 0.006 245)` → `--popover: oklch(0.22 0.007 245)`

### 3.3 对比度要求

- 品牌色与背景对比度 ≥ 4.5:1（WCAG AA）
- 品牌色仅用于大号文字/图标/背景，不用于正文

---

## 4. 字体规范

| 用途          | 字体                                 | 声明                                       |
| ------------- | ------------------------------------ | ------------------------------------------ |
| 正文 / 品牌名 | Geist Sans                           | `--font-geist-sans` (Next.js Google Fonts) |
| 数据 / 代码   | Geist Mono                           | `--font-geist-mono` (Next.js Google Fonts) |
| 品牌名样式    | Geist Sans, semibold, tracking-tight | `text-lg font-semibold tracking-tight`     |

---

## 5. 品牌域名锁定呈现

| 场景       | 呈现格式              | 说明            |
| ---------- | --------------------- | --------------- |
| Header     | `XiGee`               | 仅品牌名        |
| Footer     | `XiGee` + 降阶 `.net` | 品牌域名锁定    |
| OG 图      | `XiGee.net`           | 完整域名        |
| Meta title | `XiGee`               | 仅品牌名        |
| 版权       | `© 2026 XiGee`        | 仅品牌名        |
| API 文档   | `XiGee Studio API`    | 品牌名 + 产品线 |

降阶 `.net` CSS：`text-xs font-normal text-muted-foreground`

---

## 6. 变更记录

| 版本 | 日期       | 变更内容 |
| ---- | ---------- | -------- |
| v1.0 | 2026-09-24 | 初版     |
