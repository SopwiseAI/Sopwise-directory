"use client"

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
  /** 有筛选 tabs 的页面（首页）为 true；分类页等为 false，只保留排序 + 视图。 */
  showTabs?: boolean
}

/**
 * 产品工具栏：组合「筛选 tabs + 排序下拉 + 视图切换」。
 * 两个布局分支只负责排布，控件本身各自独立、可复用。
 */
export function ProductToolbar({
  view,
  tab,
  sort,
  onViewChange,
  onTabChange,
  onSortChange,
  showTabs = true
}: ProductToolbarProps) {
  const isLatestTab = tab === "latest"

  if (showTabs) {
    return (
      <div className="flex items-center justify-between gap-3 overflow-x-auto border-b border-border no-scrollbar">
        <FilterTabs tab={tab} onTabChange={onTabChange} />
        <div className="flex shrink-0 items-center gap-2">
          {/* 「最新」tab 已隐含按时间排序，隐藏排序控件避免语义重复 */}
          {!isLatestTab && <SortMenu sort={sort} onSortChange={onSortChange} />}
          <ViewToggle view={view} onViewChange={onViewChange} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 overflow-x-auto no-scrollbar">
      <SortMenu sort={sort} onSortChange={onSortChange} />
      <ViewToggle view={view} onViewChange={onViewChange} />
    </div>
  )
}
