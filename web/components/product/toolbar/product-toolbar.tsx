"use client"

import type { ReactNode } from "react"
import { FilterTabs } from "@/components/product/toolbar/filter-tabs"
import { SortMenu } from "@/components/product/toolbar/sort-menu"
import { ViewToggle } from "@/components/product/toolbar/view-toggle"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

interface ProductToolbarProps {
  view: ViewMode
  tab: TabMode
  sort: SortMode
  onViewChange: (view: ViewMode) => void
  onTabChange: (tab: TabMode) => void
  onSortChange: (sort: SortMode) => void
  /** 有筛选 tabs 的页面（首页）为 true；分类页等为 false，改用 title 插槽。 */
  showTabs?: boolean
  /** 由父级 useId 生成的面板 id，供 tabs 的 aria-controls 关联。 */
  panelId?: string
  /** 左侧自定义内容（无 tabs 时展示，如分类页的「分类图标 + 名称」）。 */
  title?: ReactNode
}

/**
 * 产品工具栏：单行左右布局，形如二级导航。
 * 左：筛选 tabs（全部/最新/精选）或自定义 title；右：排序下拉 + 视图切换。
 * 各类控件统一为同高（h-8）、同圆角、同边框的胶囊外观。
 */
export function ProductToolbar({
  view,
  tab,
  sort,
  onViewChange,
  onTabChange,
  onSortChange,
  showTabs = true,
  panelId,
  title
}: ProductToolbarProps) {
  const isLatestTab = tab === "latest"

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
      {showTabs ? (
        <FilterTabs tab={tab} onTabChange={onTabChange} panelId={panelId} />
      ) : (
        (title ?? <span className="text-sm font-medium text-muted-foreground">工具</span>)
      )}

      <div className="flex shrink-0 items-center gap-2">
        {/* 「最新」tab 已隐含按时间排序，隐藏排序控件避免语义重复 */}
        {!isLatestTab && <SortMenu sort={sort} onSortChange={onSortChange} />}
        <ViewToggle view={view} onViewChange={onViewChange} />
      </div>
    </div>
  )
}
