"use client"

import { LayoutGrid, List } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewMode } from "@/lib/product-query"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

/** 视图切换：列表 / 卡片，基于 shadcn ToggleGroup（图标分段控件）。 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(value) => {
        if (value[0]) onViewChange(value[0] as ViewMode)
      }}
      variant="outline"
      aria-label="视图切换"
    >
      <ToggleGroupItem value="list" aria-label="列表视图" title="列表视图">
        <List className="size-3.5" />
      </ToggleGroupItem>
      <ToggleGroupItem value="grid" aria-label="卡片视图" title="卡片视图">
        <LayoutGrid className="size-3.5" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
