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
 * - **底色通栏、下边框随内容宽度**：底色铺满主区（吸顶时内容从它下面滚过，两侧不漏内容），
 *   分隔线则与正文/页框同一宽度收在内容容器上 —— 否则信息页（内容 6xl）的下划线会比
 *   正文两边各多出 40px，看着"超长"
 * - 桌面吸附在顶栏之下；移动端不吸顶（那里已有顶栏与分类条两层）
 * - 上下留白交给外壳 main 的上内边距与调用方下边距，本组件不自带外边距
 */
export function PageBar({ children, actions, width = "content", className }: PageBarProps) {
  return (
    <div
      className={cn(
        "z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        "md:sticky md:top-0",
        className
      )}
    >
      <div className={pageShell(width, "flex h-11 items-center gap-3 border-b border-border")}>
        <div className="relative min-w-0 flex-1">
          {/*
            横向滚动槽必须留出焦点环的余量：overflow 在任一轴为 auto 时另一轴也会被裁剪，
            而站内控件的焦点环是 3px 外阴影（ring-3）—— 不留余量的话聚焦时环会被切掉一截。
            -mx-1/px-1 抵掉左右各 4px，保证第一个控件仍与内容左边缘对齐。
          */}
          <div className="no-scrollbar -mx-1 flex items-center gap-1 overflow-x-auto px-1 py-1">{children}</div>
          {/* 切换器放不下时右缘渐隐，提示还能横向滚动（与全站分类子导航同一手法） */}
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent" />
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
