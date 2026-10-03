"use client"

import { ArrowDownAZ, ArrowUpZA, ChevronDown, Clock, Sparkles, type LucideIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { toolbarControl } from "@/components/product/toolbar/styles"
import type { SortMode } from "@/lib/product-query"

const SORT_OPTIONS: { key: SortMode; label: string; icon: LucideIcon }[] = [
  { key: "recommended", label: "综合", icon: Sparkles },
  { key: "latest", label: "最新", icon: Clock },
  { key: "name-asc", label: "名称 A-Z", icon: ArrowDownAZ },
  { key: "name-desc", label: "名称 Z-A", icon: ArrowUpZA }
]

interface SortMenuProps {
  sort: SortMode
  onSortChange: (sort: SortMode) => void
}

/** 排序下拉：触发按钮为胶囊，与 tabs / 视图切换同高同圆角。 */
export function SortMenu({ sort, onSortChange }: SortMenuProps) {
  const current = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={`排序：${current.label}`} className={cn(toolbarControl, "gap-1.5 px-2.5")}>
        <CurrentIcon className="size-3.5" aria-hidden />
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className="size-3.5 opacity-60" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => onSortChange(value as SortMode)}>
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.key} value={o.key}>
              <o.icon className="size-4 text-muted-foreground" aria-hidden />
              <span>{o.label}</span>
              <DropdownMenuRadioItemIndicator />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
