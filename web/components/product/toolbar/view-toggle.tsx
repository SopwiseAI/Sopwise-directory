"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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
      variant="outline"
      spacing={0}
      aria-label="视图切换"
      className="h-8"
    >
      {VIEW_OPTIONS.map(({ value: optionValue, icon: Icon }) => {
        const label = VIEW_LABELS[optionValue]
        return (
          <ToggleGroupItem
            key={optionValue}
            value={optionValue}
            aria-label={label}
            title={label}
            className="h-full w-9 min-w-9 px-0 text-muted-foreground aria-pressed:bg-muted aria-pressed:text-foreground"
          >
            <Icon />
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
