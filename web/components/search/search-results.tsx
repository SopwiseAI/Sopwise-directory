"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { SearchX, ArrowUpRight, Sparkles } from "lucide-react"
import { createSearchIndex, highlightSegments } from "@/lib/search"
import { ProductRow } from "@/components/product/product-row"
import { PricingBadge } from "@/components/product/pricing-badge"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { Kbd } from "@/components/ui/kbd"
import { categoryIconNode } from "@/lib/category-icon-node"
import { productHistoryAttrs } from "@/lib/product"
import { getDomain } from "@/lib/url"
import { formatCount } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Category, Product } from "@/lib/types"

interface SearchResultsProps {
  products: readonly Product[]
  featured: readonly Product[]
  categories: readonly Category[]
  categoryCounts: Record<string, number>
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
 * Fisher–Yates 洗牌（确定性：同一种子同结果）。
 * 种子取自查询串哈希，服务端与客户端一致 —— 无重排闪烁。
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

/** 建议词按钮组：点击即搜索，带 pending 态。空查询与无结果态共用。 */
function SuggestionChips({
  suggestions,
  isPending,
  pendingQuery,
  onPick
}: {
  suggestions: string[]
  isPending: boolean
  pendingQuery: string | null
  onPick: (value: string) => void
}) {
  if (suggestions.length === 0) return null
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="text-xs text-muted-foreground">试试搜索：</span>
      {suggestions.map((s) => {
        const busy = isPending && pendingQuery === s
        return (
          <button
            key={s}
            type="button"
            onClick={() => onPick(s)}
            disabled={busy}
            className="rounded-md px-2 py-0.5 text-xs text-primary outline-none transition-colors hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70"
          >
            {busy ? "搜索中…" : s}
          </button>
        )
      })}
    </div>
  )
}

/** 命中片段高亮渲染。 */
function Highlighted({ text, query }: { text: string; query: string }) {
  const segments = highlightSegments(text, query)
  return (
    <>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded-sm bg-brand/15 px-0.5 text-foreground">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}

/** 搜索结果行：名称/描述高亮，副行域名 + 标签，右侧价格徽章。 */
function SearchRow({ product, query, last }: { product: Product; query: string; last: boolean }) {
  const domain = getDomain(product.url)
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      {...productHistoryAttrs(product)}
      className={cn(
        "group flex items-center gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-brand/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !last && "border-b border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 truncate text-base font-medium">
            <Highlighted text={product.name} query={query} />
          </span>
          <span className="hidden shrink-0 font-data text-muted-foreground sm:inline">{domain}</span>
        </div>
        {product.description && (
          <p className="truncate text-sm text-muted-foreground">
            <Highlighted text={product.description} query={query} />
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {product.tags && product.tags.length > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {product.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {product.pricing && <PricingBadge pricing={product.pricing} />}
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>
    </a>
  )
}

/** 分类浏览网格：无结果时为搜索意图兜底，给出可点的分类入口。 */
function CategoryBrowse({
  categories,
  categoryCounts
}: {
  categories: readonly Category[]
  categoryCounts: Record<string, number>
}) {
  const list = categories.filter((c) => (categoryCounts[c.id] ?? 0) > 0)
  if (list.length === 0) return null
  return (
    <div className="space-y-2">
      <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
        按分类浏览
        <span className="font-data font-normal text-muted-foreground">CATEGORIES</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.id}`}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors outline-none hover:border-brand/30 hover:bg-brand/[0.03] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
              {categoryIconNode(category.icon, "size-4")}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
            <span className="shrink-0 font-data text-xs text-muted-foreground">
              {formatCount(categoryCounts[category.id] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export function SearchResults({ products, featured, categories, categoryCounts }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get("q") || ""

  // 不同搜索词 → 不同推荐；同 URL 稳定。种子两端一致，故无重排闪烁。
  const displayedFeatured = useMemo(() => shuffleWithSeed(featured, hashString(query)), [featured, query])
  const suggestions = useMemo(() => displayedFeatured.slice(0, 5).map((p) => p.name), [displayedFeatured])

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<string, string>,
    [categories]
  )
  const searchIndex = useMemo(() => createSearchIndex(products, categoryNames), [products, categoryNames])

  const results = useMemo(() => {
    if (!query.trim()) return []
    return searchIndex.search(query).map((r) => r.item)
  }, [query, searchIndex])

  const [isPending, startTransition] = useTransition()
  const [pendingQuery, setPendingQuery] = useState<string | null>(null)

  const goto = (next: string) => {
    setPendingQuery(next)
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(next)}`)
    })
  }

  if (!query.trim()) {
    return (
      <div className="space-y-8">
        <Empty className="py-10">
          <EmptyMedia variant="icon" className="size-14 rounded-xl border [&_svg:not([class*='size-'])]:size-6">
            <SearchX />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyDescription>
              输入关键词开始搜索，或使用顶栏搜索框（按 <Kbd>/</Kbd> 聚焦）
            </EmptyDescription>
          </EmptyHeader>
          {suggestions.length > 0 && (
            <EmptyContent>
              <SuggestionChips
                suggestions={suggestions}
                isPending={isPending}
                pendingQuery={pendingQuery}
                onPick={goto}
              />
            </EmptyContent>
          )}
        </Empty>

        <CategoryBrowse categories={categories} categoryCounts={categoryCounts} />
      </div>
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
              未找到与 <span className="font-medium text-foreground">「{query}」</span> 相关的工具
            </EmptyDescription>
          </EmptyHeader>
          {suggestions.length > 0 && (
            <EmptyContent>
              <SuggestionChips
                suggestions={suggestions}
                isPending={isPending}
                pendingQuery={pendingQuery}
                onPick={goto}
              />
            </EmptyContent>
          )}
        </Empty>

        <CategoryBrowse categories={categories} categoryCounts={categoryCounts} />

        {displayedFeatured.length > 0 && (
          <div className="space-y-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              精选推荐
              <span className="font-data font-normal text-muted-foreground">FEATURED</span>
            </h2>
            <div className="rounded-lg border bg-card">
              {displayedFeatured.slice(0, 6).map((product, i, arr) => (
                <ProductRow key={product.id} product={product} last={i === arr.length - 1} />
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
          <SearchRow key={product.id} product={product} query={query} last={i === results.length - 1} />
        ))}
      </div>
      {displayedFeatured.length > 0 && (
        <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <Sparkles className="size-3.5" aria-hidden />
          没有想要的？试试
          <Link href="/" className="text-foreground underline-offset-4 hover:underline">
            浏览全部工具
          </Link>
        </p>
      )}
    </div>
  )
}
