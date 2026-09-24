# ailulu 页面与组件细节问题清单（PG-01 ~ PG-32）

> 审查日期：2026-08-30
> 审查方式：专家代码走查（只读） + 浏览器实测核验
> 范围：app/{page,layout,search,settings,history,not-found,category/[id]} + components/{product,layout,history,search}/* + lib/*
> 状态：**审查完成，未修改代码**

---

## P0 级（功能/内容 bug、资源 404、危险操作）

### PG-01 — 首页「精选推荐」数字 14 与实际展示 6 不符
- **高** · `app/page.tsx:31,33-35` · `featured` 有 14 个，但 `slice(0,6)` 只渲染 6 张
- **建议**：hint 改 `Math.min(featured.length, 6)` 或「精选 · 展示 6 / 共 14」；不推荐全展（拉长首页）
- **预期**：标题数字与卡片数量严格一致

### PG-02 — og.png / favicon 缺失（必然 404）
- **高** · `app/layout.tsx:33` 引用 `/og.png`，但无 `public/` 目录；无 `app/icon.*`
- **建议**：补 `public/og.png`（1200×630）+ `app/icon.png`；产图前先删 images 配置免 404
- **预期**：社交分享预览卡片 + 标签页品牌图标正常

### PG-03 — 历史「清空全部」无确认/撤销，误触即永久丢失
- **高** · `components/history/history-list.tsx:66-72,102-110`
- **建议**：A) AlertDialog 确认；或 B) 「已清空 · 撤销」toast（5 秒内缓存旧数组可恢复）
- **预期**：危险操作带确认/可撤销路径

---

## P1 级（可访问性、一致性、行为与文案）

- **PG-04**（中）搜索页缺 h1 —— 结果区顶部加 `<h1>`（可视或 sr-only）
- **PG-05**（中）`replaceState` 使"后退跟随"承诺不成立 —— 改用 `pushState` 或删注释只承诺"刷新保留/可分享"
- **PG-06**（中）一批链接缺 focus-visible 环（sub-nav/footer/brand-showcase/recent-visits/product-browser 空态/history-list）—— 统一补 `focus-visible:ring-2 ring-ring`
- **PG-07**（中）触控目标普遍 <44px（工具栏 h-7、分类项 32px、删除键 28px、搜索框 32px）—— 主操作补到 ≥36-44px
- **PG-08**（中）`text-muted-foreground/70、/80` 对比度不足（history-list:93,50 / product-browser:106）—— 正文改不透明 `text-muted-foreground`
- **PG-09**（中）元信息字号 10/11/12px 三档混用 —— 收敛为 `font-data`(11px) + `text-xs`(12px) 两档
- **PG-10**（中）页间间距 32/24/16/12px 混杂 —— 抽 spacing 层级常量统一
- **PG-11**（中）「探索精选」指向硬编码 `/search?q=GPT` 语义错位 —— 改锚点 `/#featured` 直达精选区
- **PG-12**（中）分类页 notFound 标题自带「- ailulu」与 template 叠加成双后缀 —— 只返回 `"分类未找到"`
- **PG-13**（中）历史相对时间不刷新（「5 分钟前」数小时不变）+ 非法日期无兜底 —— 60s 定时刷新 + 非法日期拦截
- **PG-14**（中）工具栏计数 aria-label 无 role 无效 + 排序组缺组语义 —— 加 `role="status"` / `role="group" aria-label="排序"`

---

## P2 级（死代码、依赖卫生、文案、微优化）

- **PG-15**（低）移动端空态误导：「顶栏命令搜索框（按 / 聚焦）」移动端不存在 —— 按 UA 分支文案 + `/` 监听加 md 守卫
- **PG-16**（低）hero 统计 18px vs 设置页 24px 字号不一致 —— 统一 token
- **PG-17**（低）编号「·」vs「01-04」混用、箭头字符 vs 图标双体系 —— 并入编号体系、统一 `ArrowRight`
- **PG-18**（低）footer 年份 SSG 固化 + 版本号双处维护 —— 接受构建时年份并注释/v 从 package.json 读
- **PG-19**（低）死代码：`StatusDot` 组件 + `status-dot` utility 未使用 —— 删除
- **PG-20**（低）死代码：`ui/Input` 无引用；`shadcn` CLI 误入 dependencies —— 删除 Input、shadcn 移 devDeps
- **PG-21**（低）`Category.icon` 死字段；新增分类图标静默缺失 —— default 返回 Bookmark 兜底 + 注释
- **PG-22**（低）sitemap/robots 硬编码 `ailulu.com` —— 从 `NEXT_PUBLIC_SITE_URL` 注入
- **PG-23**（低）sub-nav 渐变遮罩 `from-card` 与半透明底色有接缝 —— 改 `from-background`
- **PG-24**（低）`CommandSearchBar` 的 `onNavigate` 死参数 —— 删除
- **PG-25**（低）`HistoryCount` 注释说「带动画」实现无动画 —— 删注释或补轻量 pop 过渡
- **PG-26**（低）`ThemeToggle` 渲染期 matchMedia → hydration 后图标闪变 —— 双图标 CSS 切换
- **PG-27**（低）主题 radiogroup 无方向键导航 —— 用 roving tabindex 或原生 radio
- **PG-28**（低）`加载中...` ASCII 三点 + `&quot;` 直引号 —— 改「加载中…」+ 全角引号
- **PG-29**（低）ProductBrowser 无参数也恒触发一次 hydration 后重渲染 —— `getSnapshot` 只返回 search
- **PG-30**（低）「最新收录」按 createdAt（成立日期）排序与"收录"语义偏差 —— hint 改「按产品成立时间排序」
- **PG-31**（低）卡片 footer 长域名无 truncate 会挤压价格徽章 —— 加 `truncate min-w-0`
- **PG-32**（低）搜索建议词用 `<button>`+router.push —— 改 `<Link>`

---

## 优先级排序

| 优先级 | 条目 | 理由 |
|---|---|---|
| **P0** | PG-01 / PG-02 / PG-03 | 数字造假、分享无图、误删数据——低成本高收益 |
| **P1** | PG-04~PG-14 | 可达性 + 一致性批量收敛 |
| **P2** | PG-15~PG-32 | 死代码、依赖卫生、文案、微优化 |

## 整体印象（最突出 3 点）

1. **数据口径不自洽**：精选 14 展示 6（PG-01）、探索精选→GPT（PG-11）、最新收录按成立日期（PG-30）——"数字/文案与数据含义脱节"
2. **微排版未收敛**：字号三档（PG-09）、间距四档（PG-10）、编号/箭头混用（PG-17）——缺落地的 type/spacing scale
3. **可达性覆盖不齐**：focus 环部分缺失（PG-06）、触控 <44px（PG-07）、清空无确认（PG-03）