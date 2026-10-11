"use client"

import { Button } from "@/components/ui/button"

interface SuggestionChipsProps {
  label?: string
  suggestions: readonly string[]
  onPick: (value: string) => void
  className?: string
}

/**
 * 建议词按钮组：点一下即搜。
 *
 * 改「边打边搜」之后这里不再需要 pending 态 —— 换词走的是本地 `replaceState`，
 * 结果同帧出现，没有等待窗口可以展示「搜索中…」。
 */
export function SuggestionChips({ label = "试试搜索：", suggestions, onPick, className }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
      {suggestions.map((s) => (
        <Button
          key={s}
          variant="ghost"
          size="xs"
          aria-label={s}
          onClick={() => onPick(s)}
          className="rounded-md px-2 text-primary hover:bg-primary/10 hover:text-primary"
        >
          {s}
        </Button>
      ))}
    </div>
  )
}
