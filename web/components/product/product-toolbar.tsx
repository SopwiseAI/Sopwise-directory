"use client"

import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"

export type ViewMode = "list" | "grid"

export type FilterMode = "featured" | "latest"

interface ProductToolbarProps {
  count: number
  view: ViewMode
  filter: FilterMode
  onViewChange: (view: ViewMode) => void
  onFilterChange: (filter: FilterMode) => void
}

export function ProductToolbar({ count, view, filter, onViewChange, onFilterChange }: ProductToolbarProps) {
  const segItem = (active: boolean) =>
    cn(
      "flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex items-center rounded-md border bg-card p-0.5" role="group" aria-label="筛选">
        <button
          type="button"
          onClick={() => onFilterChange("featured")}
          aria-pressed={filter === "featured"}
          className={segItem(filter === "featured")}
        >
          精选
        </button>
        <button
          type="button"
          onClick={() => onFilterChange("latest")}
          aria-pressed={filter === "latest"}
          className={segItem(filter === "latest")}
        >
          全部
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-data text-muted-foreground" role="status" aria-label={`共 ${count} 个产品`}>
          {formatCount(count)} 个产品
        </span>
        <div className="inline-flex items-center rounded-md border bg-card p-0.5" role="group" aria-label="视图切换">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            aria-pressed={view === "list"}
            aria-label="列表视图"
            title="列表视图"
            className={segItem(view === "list")}
          >
            <List className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewChange("grid")}
            aria-pressed={view === "grid"}
            aria-label="卡片视图"
            title="卡片视图"
            className={segItem(view === "grid")}
          >
            <LayoutGrid className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
