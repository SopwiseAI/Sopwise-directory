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
  suggestions: string[]
}

export function SearchResults({ products, featured, suggestions }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

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

        {featured.length > 0 && (
          <div className="space-y-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              精选推荐
              <span className="font-data font-normal text-muted-foreground">FEATURED</span>
            </h2>
            <div className="rounded-lg border bg-card">
              {featured.map((product, i) => (
                <ProductRow key={product.id} product={product} last={i === featured.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
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
