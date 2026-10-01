"use client"

import { LayoutGrid, List, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ViewMode } from "@/lib/product-query"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

function ViewButton({
  active,
  label,
  icon: Icon,
  onClick
}: {
  active: boolean
  label: string
  icon: LucideIcon
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        "rounded-sm p-1 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

/** 视图切换：列表 / 卡片（图标分段控件）。 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex shrink-0 items-center rounded-md border bg-card p-0.5" role="group" aria-label="视图切换">
      <ViewButton active={view === "list"} label="列表视图" icon={List} onClick={() => onViewChange("list")} />
      <ViewButton active={view === "grid"} label="卡片视图" icon={LayoutGrid} onClick={() => onViewChange("grid")} />
    </div>
  )
}
