"use client"

import { ChevronDown, type LucideIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface FilterOption {
  value: string
  label: string
}

interface FilterSelectProps {
  label: string
  icon: LucideIcon
  value: string
  options: FilterOption[]
  onChange: (value: string) => void
  active?: boolean
}

/** 工具条上的紧凑筛选下拉：触发按钮显示当前选中项，菜单单选。 */
export function FilterSelect({ label, icon: Icon, value, options, onChange, active }: FilterSelectProps) {
  const selected = options.find((o) => o.value === value)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={label}
            className={cn(
              "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-brand/40 bg-brand/10 text-brand"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-3.5 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{selected?.label ?? label}</span>
            <ChevronDown className="size-3.5 shrink-0 opacity-60" aria-hidden />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-[9rem]">
        <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(String(next))}>
          {options.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="pr-8 pl-2 text-xs">
              {option.label}
              <DropdownMenuRadioItemIndicator />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
