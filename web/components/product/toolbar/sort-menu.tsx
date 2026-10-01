"use client"

import { ArrowDownAZ, ArrowUpZA, ChevronDown, Clock, type LucideIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import type { SortMode } from "@/lib/product-query"

const SORT_OPTIONS: { key: SortMode; label: string; icon: LucideIcon }[] = [
  { key: "latest", label: "最新", icon: Clock },
  { key: "name-asc", label: "名称 A-Z", icon: ArrowDownAZ },
  { key: "name-desc", label: "名称 Z-A", icon: ArrowUpZA }
]

interface SortMenuProps {
  sort: SortMode
  onSortChange: (sort: SortMode) => void
}

/** 排序下拉：触发按钮显示当前排序，菜单项带图标与选中打勾。 */
export function SortMenu({ sort, onSortChange }: SortMenuProps) {
  const current = SORT_OPTIONS.find((o) => o.key === sort) ?? SORT_OPTIONS[0]
  const CurrentIcon = current.icon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`排序：${current.label}`}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border bg-card px-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <CurrentIcon className="size-3.5" />
        <span className="whitespace-nowrap">{current.label}</span>
        <ChevronDown className="size-3.5 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={sort} onValueChange={(value) => onSortChange(value as SortMode)}>
          {SORT_OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.key} value={o.key} closeOnClick>
              <o.icon className="size-4 text-muted-foreground" />
              <span>{o.label}</span>
              <DropdownMenuRadioItemIndicator />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
