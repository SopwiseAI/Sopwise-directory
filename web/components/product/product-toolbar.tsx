"use client"

import { LayoutGrid, List } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"

export type ViewMode = "list" | "grid"

export type SortMode = "recommended" | "latest"

interface ProductToolbarProps {
  count: number
  view: ViewMode
  sort: SortMode
  onViewChange: (view: ViewMode) => void
  onSortChange: (sort: SortMode) => void
}

/** 工具栏：视图切换（列表/卡片）+ 排序（推荐/最新）+ mono 计数 */
export function ProductToolbar({ count, view, sort, onViewChange, onSortChange }: ProductToolbarProps) {
  const segItem = (active: boolean) =>
    cn(
      // h-9 (36px)：触控目标达标（PG-07）
      "flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
      active
        ? "bg-accent font-medium text-accent-foreground"
        : "text-muted-foreground hover:bg-muted hover:text-foreground"
    )

  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="inline-flex items-center rounded-md border bg-card p-0.5" role="group" aria-label="排序">
        <button
          type="button"
          onClick={() => onSortChange("recommended")}
          aria-pressed={sort === "recommended"}
          className={segItem(sort === "recommended")}
        >
          推荐
        </button>
        <button
          type="button"
          onClick={() => onSortChange("latest")}
          aria-pressed={sort === "latest"}
          className={segItem(sort === "latest")}
        >
          最新
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