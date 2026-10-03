"use client"

import { LayoutGrid, List } from "lucide-react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { toolbarControl } from "@/components/product/toolbar/styles"
import type { ViewMode } from "@/lib/product-query"

interface ViewToggleProps {
  view: ViewMode
  onViewChange: (view: ViewMode) => void
}

/** 视图切换：卡片（默认）/ 列表，同高胶囊分段控件，两段等宽、无缝隙。 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <ToggleGroup
      value={[view]}
      onValueChange={(value) => {
        if (value[0]) onViewChange(value[0] as ViewMode)
      }}
      spacing={0}
      aria-label="视图切换"
      className={cn(toolbarControl, "gap-0 overflow-hidden p-0")}
    >
      <ToggleGroupItem
        value="grid"
        aria-label="卡片视图"
        title="卡片视图"
        className="h-7 w-9 rounded-none border-0 p-0 text-muted-foreground data-[pressed]:bg-muted data-[pressed]:text-foreground"
      >
        <LayoutGrid className="size-4" />
      </ToggleGroupItem>
      <ToggleGroupItem
        value="list"
        aria-label="列表视图"
        title="列表视图"
        className="h-7 w-9 rounded-none border-0 p-0 text-muted-foreground data-[pressed]:bg-muted data-[pressed]:text-foreground"
      >
        <List className="size-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
