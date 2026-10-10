import { cn } from "@/lib/utils"

/**
 * 全站页面容器宽度档位 —— 页面宽度的唯一来源，页面里不再各写 `max-w-*` 字面量。
 *
 * - `browse`：浏览型（首页 / 分类的卡片网格），与外壳 `main`、页脚对齐。
 * - `content`：内容型（设置 / 历史 / 搜索 / 关于 / 隐私 / 条款），比浏览型小一档 ——
 *   既不会在大屏上被挤成一条窄栏，也不会把长文行宽拉到不适合阅读。
 */
export const PAGE_WIDTH = {
  browse: "max-w-7xl",
  content: "max-w-6xl"
} as const

export type PageWidth = keyof typeof PAGE_WIDTH

/** 页面容器：居中限宽。水平内边距由外壳 `main` 统一提供，这里不重复加。 */
export function pageShell(width: PageWidth = "content", className?: string) {
  return cn("mx-auto w-full", PAGE_WIDTH[width], className)
}
