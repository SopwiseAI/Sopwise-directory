"use client"

import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"

export const PRODUCT_TABS = [
  { key: "all", label: "全部" },
  { key: "latest", label: "最新" },
  { key: "featured", label: "精选" }
] as const

export type TabMode = (typeof PRODUCT_TABS)[number]["key"]

export type ViewMode = "list" | "grid"

export type SortMode = "latest" | "name-asc" | "name-desc"

interface ProductToolbarProps {
  count: number
  view: ViewMode
  tab: TabMode
  sort: SortMode
  onViewChange: (view: ViewMode) => void
  onTabChange: (tab: TabMode) => void
  onSortChange: (sort: SortMode) => void
  showTabs?: boolean
}

const sortLabels: Record<SortMode, string> = {
  latest: "最新",
  "name-asc": "A-Z",
  "name-desc": "Z-A"
}

function ViewToggleGroup({ view, onViewChange }: { view: ViewMode; onViewChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-md border bg-card p-0.5" role="group" aria-label="视图切换">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        aria-pressed={view === "list"}
        aria-label="列表视图"
        title="列表视图"
        className={cn(
          "rounded-sm p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          view === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <List className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onViewChange("grid")}
        aria-pressed={view === "grid"}
        aria-label="卡片视图"
        title="卡片视图"
        className={cn(
          "rounded-sm p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
          view === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <LayoutGrid className="size-3.5" />
      </button>
    </div>
  )
}

function CountBadge({ count }: { count: number }) {
  return (
    <span className="font-data text-muted-foreground" role="status" aria-label={`共 ${count} 个产品`}>
      {formatCount(count)}
    </span>
  )
}

export function ProductToolbar({
  count,
  view,
  tab,
  sort,
  onViewChange,
  onTabChange,
  onSortChange,
  showTabs = true
}: ProductToolbarProps) {
  const isLatestTab = tab === "latest"

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const currentIndex = PRODUCT_TABS.findIndex((t) => t.key === tab)
    let nextIndex: number | null = null
    if (e.key === "ArrowRight") nextIndex = (currentIndex + 1) % PRODUCT_TABS.length
    if (e.key === "ArrowLeft") nextIndex = (currentIndex - 1 + PRODUCT_TABS.length) % PRODUCT_TABS.length
    if (nextIndex !== null) {
      e.preventDefault()
      const next = PRODUCT_TABS[nextIndex].key
      onTabChange(next)
      document.getElementById(`product-tab-${next}`)?.focus()
    }
  }

  return (
    <div className="space-y-0">
      {showTabs && (
        <div className="flex items-center justify-between border-b border-border">
          <div
            className="-mb-px flex items-center gap-0"
            role="tablist"
            aria-label="产品筛选"
            onKeyDown={handleTabKeyDown}
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
                  "px-4 py-2.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded-t-sm",
                  tab === t.key
                    ? "text-foreground border-b-2 border-brand"
                    : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-sm">
            {!isLatestTab && (
              <div className="flex items-center rounded-md border bg-card p-0.5" role="group" aria-label="排序">
                {(["latest", "name-asc", "name-desc"] as SortMode[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSortChange(s)}
                    aria-pressed={sort === s}
                    className={cn(
                      "rounded-sm px-2 py-0.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      sort === s
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sortLabels[s]}
                  </button>
                ))}
              </div>
            )}

            <ViewToggleGroup view={view} onViewChange={onViewChange} />
            <CountBadge count={count} />
          </div>
        </div>
      )}

      {!showTabs && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            {(["latest", "name-asc", "name-desc"] as SortMode[]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onSortChange(s)}
                aria-pressed={sort === s}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring border",
                  sort === s
                    ? "bg-accent font-medium text-accent-foreground border-border"
                    : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
                )}
              >
                {sortLabels[s]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <ViewToggleGroup view={view} onViewChange={onViewChange} />
            <CountBadge count={count} />
          </div>
        </div>
      )}
    </div>
  )
}
