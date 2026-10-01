"use client"

import { cn } from "@/lib/utils"
import type { TabMode } from "@/lib/product-query"

export const PRODUCT_TABS = [
  { key: "all", label: "全部" },
  { key: "latest", label: "最新" },
  { key: "featured", label: "精选" }
] as const satisfies readonly { key: TabMode; label: string }[]

interface FilterTabsProps {
  tab: TabMode
  onTabChange: (tab: TabMode) => void
}

/** 产品筛选 tablist（全部 / 最新 / 精选），支持方向键切换。 */
export function FilterTabs({ tab, onTabChange }: FilterTabsProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = PRODUCT_TABS.findIndex((t) => t.key === tab)
    let nextIndex: number | null = null
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % PRODUCT_TABS.length
    else if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + PRODUCT_TABS.length) % PRODUCT_TABS.length
    else if (e.key === "Home") nextIndex = 0
    else if (e.key === "End") nextIndex = PRODUCT_TABS.length - 1
    if (nextIndex !== null) {
      e.preventDefault()
      const next = PRODUCT_TABS[nextIndex].key
      onTabChange(next)
      document.getElementById(`product-tab-${next}`)?.focus()
    }
  }

  return (
    <div
      className="-mb-px flex shrink-0 items-center gap-0"
      role="tablist"
      aria-label="产品筛选"
      onKeyDown={handleKeyDown}
    >
      {PRODUCT_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          id={`product-tab-${t.key}`}
          aria-selected={tab === t.key}
          aria-controls="product-tabpanel"
          tabIndex={tab === t.key ? 0 : -1}
          onClick={() => onTabChange(t.key)}
          className={cn(
            "whitespace-nowrap rounded-t-sm px-3 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-4",
            tab === t.key
              ? "border-b-2 border-brand text-foreground"
              : "border-b-2 border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
