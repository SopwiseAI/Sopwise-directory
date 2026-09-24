# ailulu 侧边栏问题清单（SB-01 ~ SB-17）

> 审查日期：2026-08-30
> 审查方式：代码审读 + agent-browser 对 ailulu（:3000）与 DeepSeek Harness GUI（:3080）的 DOM 级实测
> 状态：**研究完成，未修改代码**（等待确认后动工）

---

## P0 级（用户反馈 / 明显 bug，建议立即修）

### SB-01 — 折叠状态下刷新"先展开再折叠"闪烁

- **严重度**：高（用户反馈 #1）
- **代码位置**：`components/category/category-sidebar.tsx:40-42`（`getServerSnapshot` 恒返回 `false`）、`:133-134`（`w-[280px]` + `transition-[width] duration-200`）
- **触发场景**：已保存"折叠"偏好的用户刷新任意页面。实测服务端 HTML 恒为 `w-[280px]` 展开结构；hydration 后读取 localStorage 发现折叠 → 重渲染折叠 + 200ms 宽度动画 → 可见"先展开再折叠"。
- **建议方案（3 选 1）**：
  - **A. 首帧前内联脚本 + data 属性 + CSS 先行（推荐）**：仿 `themeScript` 加 `beforeInteractive` 脚本读折叠偏好写 `<html data-c>`；globals.css 用属性选择器强制 rail 宽度；跳过首帧过渡。利：首帧即折叠、无闪烁、无 mismatch、与主题防闪烁同构；弊：双轨控制需注释说明。
  - **B. 首帧禁过渡的硬切（最简）**：mount 后恢复过渡。利：一行改动；弊：仍是瞬时跳变，根治不彻底。
  - **C. 双结构 + CSS 变量统一切换（最彻底）**：利：无任何跳变；弊：DOM 变大、重构成本高。
  - 不推荐：`getServerSnapshot` 读 DOM + `suppressHydrationWarning`（React 官方反模式）。
- **预期效果**：折叠用户刷新 → 首帧即 56px rail，无展开闪现、无宽度动画。

### SB-02 — 折叠态 rail 图标排列过挤（对标 DSH 实测）

- **严重度**：高（用户反馈 #2）
- **代码位置**：`category-sidebar.tsx:172`（`gap-0.5`）、`:244-245`（`py-1.5`）、图标 `size-4`（16px）、`:153`（折叠态品牌区无 padding）
- **DSH 实测对比**：

  | 指标      | DSH        | ailulu      |
  | --------- | ---------- | ----------- |
  | rail 宽度 | 56px       | 56px ✓      |
  | 命中区    | 36×36 按钮 | 行高 34.5px |
  | 内容道    | 36px       | 44px        |
  | 纵向节距  | 48px       | ~36.5px     |
  | 图标      | 18×18      | 16×16       |

- **建议方案**：`nav` gap → 6–8px；折叠态行 → 行高 ≈38px；折叠态图标 → 18px（`size-4.5`）；`px-1.5` → `px-2.5`；折叠态品牌区补 `pt-1.5~2`。
- **预期效果**：rail 视觉节律对齐 DSH：48px 节距、18px 图标、36px 内容道。

### SB-03 — 展开态误弹固定 tooltip（真实功能 bug）

- **严重度**：高
- **代码位置**：`category-sidebar.tsx:121-125`（`handleTip` 无 `collapsed` 守卫）、`:239-242`（无条件调用 `onHover`）
- **触发场景**：展开态 hover 任意导航项 → 文字已可见却仍浮现气泡，遮挡内容。
- **建议方案**：`handleTip` 首行加 `if (!collapsed) return setTip(undefined)`，一行修复。
- **预期效果**：tooltip 仅 rail 态出现。

---

## P1 级（可访问性 / 结构性，建议本周内）

### SB-04 — HistoryCount 角标 post-hydration 才出现 + store 守卫写法不一致

- **严重度**：中
- **位置**：`components/history/history-count.tsx:11`、`category-sidebar.tsx:32-38`
- **建议**：角标随 SB-01 一并纳入首帧引导；`getSnapshot` 统一加 `typeof window` 守卫。
- **预期**：角标不"闪现出现"，store 约定统一。

### SB-07 — 折叠切换按钮缺少 aria-expanded / aria-controls

- **严重度**：中（可访问性必答项）
- **位置**：`category-sidebar.tsx:68-85`、`:104-112`
- **建议**：两按钮加 `aria-controls="category-sidebar"`；开关按钮加 `aria-expanded`。
- **预期**：读屏用户明确知晓开关状态。

### SB-08 — tooltip 无 ARIA 关联，role 孤儿化

- **严重度**：中
- **位置**：`category-sidebar.tsx:138-149`、`:239-242`
- **建议**：a) tooltip 加 `id` + 折叠态 Links 挂 `aria-describedby`；或 b) 移除 `role="tooltip"` 纯视觉化 + Links 补 `aria-label`。
- **预期**：无孤儿 role，读屏输出一致。

### SB-10 — useSyncExternalStore 三重订阅 + toggle 逻辑复制粘贴

- **严重度**：中
- **位置**：`:55`、`:91`、`:118`（同 key 三份订阅）、`:57-65` 与 `:93-101`（toggle 逐字重复）
- **建议**：抽 `useSidebarCollapsed()` hook（单一订阅 + 单一 toggle），`STORAGE_KEY`/`subscribe` 移入独立模块（如 `lib/sidebar-state.ts`）。
- **预期**：状态逻辑唯一实现，切换只触发一次监听链。

### SB-17 — 环境观察：:3000 dev server 整页不 hydration（需用户侧复测）

- **严重度**：中（验收阻塞项，非代码缺陷）
- **现象**：全 DOM 扫描 0 个 React 标记、无 console 报错、按钮均无效果——页面是"纯静态 SSR HTML"。
- **建议**：【用户侧】先重启 `pnpm dev` 复测。若恢复正常，SB-01~SB-16 结论不受影响。

---

## P2 级（视觉微调 / 性能备忘 / 边界交互，可延后）

- **SB-05** — 折叠态品牌区贴顶无留白 + hover 覆盖层半透明残影（低）：加 `pt-1.5~2`、覆盖层改不透明 `bg-sidebar`
- **SB-06** — rail 顶部按钮"命中区与视觉圆"不一致（低）：外层按钮收窄 36×36 圆居中，移冗余 `self-center`
- **SB-09** — "分类"分组标签非 heading；reduced-motion 未覆盖侧栏（低）：`<p>` → `<h2>`，加 `motion-reduce:transition-none`
- **SB-11** — 分类计数模块顶层 + 渲染期重复 filter（低）：建 `categoryCounts` Map 单次计算，三处共享
- **SB-12** — tooltip 依赖 setState + getBoundingClientRect（低，备忘）：当前无瓶颈，暂不处理
- **SB-13** — 折叠态 tooltip 与 nav 滚动不同步（低）：滚动时重算坐标
- **SB-14** — tooltip 无边界翻转，底部条目可能溢出视口（低）：clamp 到视口
- **SB-15** — 原生 title 与自定义气泡两种 tooltip 并存（低）：品牌按钮接入统一气泡体系 + ~150ms 延迟
- **SB-16** — 死代码 / 可简化项（低）：并入 SB-10 重构顺带完成

---

## 优先级排序建议

| 优先级   | Issue                         | 一句话理由                                       |
| -------- | ----------------------------- | ------------------------------------------------ |
| **P0**   | **SB-01 刷新闪烁**            | 用户反馈 #1；方案 A 改动小且根治，顺带覆盖 SB-04 |
| **P0**   | **SB-02 rail 拥挤**           | 用户反馈 #2；纯间距调整，DSH 实测数字可直接落地  |
| **P0**   | **SB-03 展开态 tooltip bug**  | 一行守卫，肉眼可见的交互错误                     |
| **P1**   | **SB-07 aria-expanded**       | 可访问性必答项                                   |
| **P1**   | **SB-10 状态订阅去重**        | 与 SB-01 改造互为前置                            |
| **P1**   | **SB-08 tooltip ARIA**        | 与 SB-15 的 tooltip 统一可合并                   |
| **P2**   | SB-05/06/09/11/12/13/14/15/16 | 视觉微调、性能备忘、边界交互                     |
| **先行** | **SB-17 环境复测**            | 先重启 `pnpm dev` 确认交互基线                   |

---

## 核心结论回顾

1. **闪烁根因**：`getServerSnapshot` 恒展开 + post-hydration 重渲染 + 200ms 宽度过渡 → 推荐"内联脚本 + data 属性 + CSS 先行"
2. **rail 拥挤**：已用 DSH 实测数字量化（48px 节距 / 18px 图标 / 36px 内容道为目标值）
3. **新发现**：展开态误弹 tooltip 的真 bug + 一组 a11y/性能/整洁度问题
4. **环境**：建议先重启 `pnpm dev` 复测交互基线
