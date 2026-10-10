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
 * 二级栏：内容区顶部的一条控制栏，全站统一形态。
 *
 * - 定高 `h-11` 单行：切换器横向滚动（带右缘渐隐提示），辅助控件始终钉在右侧 ——
 *   不折行，避免手机上栏高变成 83/111px 那种"不像栏"的形态
 * - 下边框通栏、背景通栏：吸顶时内容从它下面滚过，分隔线不会断
 * - 桌面吸附在顶栏之下；移动端不吸顶（那里已有顶栏与分类条两层）
 * - 上下留白交给外壳 main 的上内边距与调用方下边距，本组件不自带外边距
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
      <div className={pageShell(width, "flex h-11 items-center gap-3")}>
        <div className="relative min-w-0 flex-1">
          <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">{children}</div>
          {/* 切换器放不下时右缘渐隐，提示还能横向滚动（与全站分类子导航同一手法） */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
