"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { toolbarControl } from "@/components/product/toolbar/styles"
import { VIEW_OPTIONS } from "@/lib/product-options"
import type { ViewMode } from "@/lib/product-query"

const VIEW_LABELS: Record<ViewMode, string> = { grid: "卡片视图", list: "列表视图" }

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
      {VIEW_OPTIONS.map(({ value: optionValue, icon: Icon }) => {
        const label = VIEW_LABELS[optionValue]
        return (
          <ToggleGroupItem
            key={optionValue}
            value={optionValue}
            aria-label={label}
            title={label}
            className="h-7 w-9 rounded-none border-0 p-0 text-muted-foreground data-[pressed]:bg-muted data-[pressed]:text-foreground"
          >
            <Icon className="size-4" />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
