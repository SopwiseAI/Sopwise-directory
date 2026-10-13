"use client"

import { History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import { CategoryBrowse } from "@/components/search/category-browse"
import { SuggestionChips } from "@/components/search/suggestion-chips"
import type { Category } from "@/lib/types"

interface SearchLandingProps {
  /** 最近搜索词（localStorage，最新在前）。 */
  recent: readonly string[]
  onClearRecent: () => void
  suggestions: readonly string[]
  categories: readonly Category[]
  categoryCounts: Record<string, number>
  onPick: (query: string) => void
}

/**
 * 空查询时的着陆态：这里不是「空状态」，而是搜索的入口页 ——
 * 所以不用 `Empty`，而是把「最近搜索」摆在最前，让回头客一键回到刚才那条。
 */
export function SearchLanding({
  recent,
  onClearRecent,
  suggestions,
  categories,
  categoryCounts,
  onPick,
}: SearchLandingProps) {
  return (
    <div className="flex flex-col gap-8">
      <p className="text-sm text-muted-foreground">
        输入关键词搜索，或从下面挑一个开始；顶栏搜索框随时可按 <Kbd>/</Kbd> 聚焦。
      </p>

      {recent.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              <History className="size-4 self-center text-muted-foreground" aria-hidden />
              最近搜索
              <span className="font-data text-xs font-normal text-muted-foreground">RECENT</span>
            </h2>
            <Button variant="ghost" size="sm" onClick={onClearRecent}>
              清空
            </Button>
          </div>
          <SuggestionChips label="" suggestions={recent} onPick={onPick} />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
          试试这些
          <span className="font-data text-xs font-normal text-muted-foreground">TRY</span>
        </h2>
        <SuggestionChips label="" suggestions={suggestions} onPick={onPick} />
      </section>

      <CategoryBrowse categories={categories} categoryCounts={categoryCounts} />
    </div>
  )
}
