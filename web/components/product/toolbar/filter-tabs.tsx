"use client"

import type { LucideIcon } from "lucide-react"
import { LayoutGrid, Clock, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TabMode } from "@/lib/product-query"

export const PRODUCT_TABS: { key: TabMode; label: string; icon: LucideIcon }[] = [
  { key: "all", label: "全部", icon: LayoutGrid },
  { key: "latest", label: "最新", icon: Clock },
  { key: "featured", label: "精选", icon: Sparkles }
]

interface FilterTabsProps {
  tab: TabMode
  onTabChange: (tab: TabMode) => void
  /** 面板 id（与 tabpanel 关联，避免同页多实例冲突）。 */
  panelId?: string
}

/**
 * 产品筛选：全部 / 最新 / 精选，胶囊分段控件（对齐信息区子导航的视觉语言）。
 * 每项为 button 而非 link（会话级筛选，体现在 URL query），选中态 bg-brand/10 + 品牌色。
 */
export function FilterTabs({ tab, onTabChange, panelId }: FilterTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="产品筛选"
      aria-controls={panelId}
      className="no-scrollbar flex items-center gap-1 overflow-x-auto"
    >
      {PRODUCT_TABS.map(({ key, label, icon: Icon }) => {
        const active = key === tab
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls={panelId}
            onClick={() => onTabChange(key)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        )
      })}
    </div>
  )
}
