"use client"

import { ChevronDown } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { SORT_OPTIONS } from "@/lib/product-options"
import type { SortMode } from "@/lib/product-query"

interface SortMenuProps {
  sort: SortMode
  onSortChange: (sort: SortMode) => void
}

/** 排序下拉：触发按钮复用 Button outline（与视图切换同高 h-8、同圆角）。 */
export function SortMenu({ sort, onSortChange }: SortMenuProps) {
  const current = SORT_OPTIONS.find((o) => o.value === sort) ?? SORT_OPTIONS[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`排序：${current.label}`}
        render={<Button variant="outline" className="text-xs" />}
      >
        <CurrentIcon data-icon="inline-start" aria-hidden />
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown data-icon="inline-end" className="opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => onSortChange(value as SortMode)}>
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              <o.icon className="text-muted-foreground" aria-hidden />
              <span>{o.label}</span>
              <DropdownMenuRadioItemIndicator />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
