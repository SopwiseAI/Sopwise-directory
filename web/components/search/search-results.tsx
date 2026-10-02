"use client"

import { useMemo, useState, useTransition } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchX } from "lucide-react"
import { createSearchIndex } from "@/lib/search"
import { ProductRow } from "@/components/product/product-row"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { formatCount } from "@/lib/format"
import type { Product } from "@/lib/types"

interface SearchResultsProps {
  products: readonly Product[]
  featured: readonly Product[]
}

/** FNV-1a 32 位哈希：把查询串映射为洗牌种子。 */
function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/**
 * Fisher–Yates 洗牌（确定性：同一种子同结果，返回新数组）。
 * 种子取自查询串哈希，服务端与客户端算出同一顺序 —— 不产生水合不一致，也不会有「先原序后乱序」的闪烁。
 */
function shuffleWithSeed<T>(items: readonly T[], seed: number): T[] {
  const arr = [...items]
  let s = seed || 1
  for (let i = arr.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    const j = Math.floor((s / 4294967296) * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function SearchResults({ products, featured }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  // 不同搜索词 → 不同推荐；同 URL 稳定。种子两端一致，故无重排闪烁。
  const displayedFeatured = useMemo(() => shuffleWithSeed(featured, hashString(query)), [featured, query])
  const suggestions = useMemo(() => displayedFeatured.slice(0, 5).map((p) => p.name), [displayedFeatured])

  const searchIndex = useMemo(() => createSearchIndex(products), [products])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchIndex.search(query).map((r) => r.item)
  }, [query, searchIndex])

  const [isPending, startTransition] = useTransition()
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)

  if (!query.trim()) {
    return (
      <Empty className="py-16">
        <EmptyMedia variant="icon" className="size-16 rounded-xl border [&_svg:not([class*='size-'])]:size-7">
          <SearchX />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyDescription>
            输入关键词开始搜索，或使用顶栏命令搜索框（按 <span className="kbd">/</span> 聚焦）
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  if (results.length === 0) {
    return (
      <div className="space-y-8">
        <Empty className="py-8">
          <EmptyMedia variant="icon" className="size-14 rounded-xl border [&_svg:not([class*='size-'])]:size-6">
            <SearchX />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyDescription>
              未找到与 <span className="font-medium text-foreground">「{query}」</span> 相关的产品
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
              <span className="text-xs text-muted-foreground">试试搜索：</span>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPendingQuery(s)
                    startTransition(() => {
                      router.push(`/search?q=${encodeURIComponent(s)}`)
                    })
                  }}
                  className={
                    "rounded-md px-2 py-0.5 text-xs text-primary hover:bg-primary/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring" +
                    (isPending && pendingQuery === s ? " opacity-70" : "")
                  }
                  disabled={isPending && pendingQuery === s}
                >
                  {isPending && pendingQuery === s ? "搜索中…" : s}
                </button>
              ))}
            </div>
          </EmptyContent>
        </Empty>

        {displayedFeatured.length > 0 && (
          <div className="space-y-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              精选推荐
              <span className="font-data font-normal text-muted-foreground">FEATURED</span>
            </h2>
            <div className="rounded-lg border bg-card">
              {displayedFeatured.map((product, i) => (
                <ProductRow key={product.id} product={product} last={i === displayedFeatured.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
        找到 <span className="font-data font-medium text-foreground">{formatCount(results.length)}</span> 个与{" "}
        <span className="font-medium text-foreground">「{query}」</span> 相关的结果
      </p>
      <div className="rounded-lg border bg-card">
        {results.map((product, i) => (
          <ProductRow key={product.id} product={product} last={i === results.length - 1} />
        ))}
      </div>
    </div>
  )
}
