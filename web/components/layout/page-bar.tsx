import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { pageShell, type PageWidth } from "@/lib/layout"

interface PageBarProps {
  /** 左槽：该页的主切换器（筛选 tabs / 分类名 / 信息页导航） */
  children: ReactNode
  /** 右槽：该页的辅助控件（排序、视图、计数、清空） */
  actions?: ReactNode
  /** 内容容器宽度，需与该页正文一致（browse = 浏览型 7xl；content = 内容型 6xl） */
  width?: PageWidth
  className?: string
}

/**
 * 二级栏：内容区顶部的一条控制栏，全站统一形态 ——
 * `h-11` · 下边框 · 左切换器 / 右辅助控件 · 桌面吸附在顶栏之下。
 *
 * 各页放什么由页面决定（信息页放页面导航，首页放筛选 + 排序/视图，
 * 历史页放搜索 + 筛选 + 清空），形态一致，语义各归其位。
 *
 * 上下留白交给外壳 main 的上内边距与调用方的下边距，本组件不自带外边距 ——
 * 曾经试过抵消上内边距让栏紧贴顶栏，观感过于逼仄，故保持留白。
 * 移动端不吸顶：那里已经有顶栏与分类条两层吸顶，再多一层会挤占阅读区。
 */
export function PageBar({ children, actions, width = "content", className }: PageBarProps) {
  return (
    <div
      className={cn(
        "z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "md:sticky md:top-0",
        className
      )}
    >
      <div
        className={pageShell(
          width,
          // 桌面单行定高；窄屏允许折行（历史页的搜索框 + 两个筛选在手机上一行放不下）
          "flex min-h-11 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 py-1.5 md:h-11 md:flex-nowrap md:py-0"
        )}
      >
        <div className="flex min-w-0 flex-wrap items-center gap-1 md:flex-nowrap">{children}</div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
