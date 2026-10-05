import type { LucideIcon } from "lucide-react"
import { ArrowDownAZ, ArrowUpZA, Clock, LayoutGrid, List, Sparkles, Star } from "lucide-react"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

export interface ProductOption<T extends string> {
  value: T
  label: string
  icon: LucideIcon
}

/** 视图模式选项（宫格 / 列表）。产品工具栏与浏览偏好共用。 */
export const VIEW_OPTIONS: readonly ProductOption<ViewMode>[] = [
  { value: "grid", label: "宫格", icon: LayoutGrid },
  { value: "list", label: "列表", icon: List }
]

/** 排序模式选项。产品工具栏与浏览偏好共用。 */
export const SORT_OPTIONS: readonly ProductOption<SortMode>[] = [
  { value: "recommended", label: "综合", icon: Sparkles },
  { value: "latest", label: "最新", icon: Clock },
  { value: "name-asc", label: "名称 A-Z", icon: ArrowDownAZ },
  { value: "name-desc", label: "名称 Z-A", icon: ArrowUpZA }
]

/** Tab 模式选项（全部 / 最新 / 精选）。产品工具栏与浏览偏好共用。 */
export const TAB_OPTIONS: readonly ProductOption<TabMode>[] = [
  { value: "all", label: "全部", icon: LayoutGrid },
  { value: "latest", label: "最新", icon: Clock },
  { value: "featured", label: "精选", icon: Star }
]
