"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { SearchLanding } from "@/components/search/search-landing"
import { SearchNoResults } from "@/components/search/search-no-results"
import { SearchResultRow } from "@/components/search/search-result-row"
import { SearchToolbar, type SearchFacet } from "@/components/search/search-toolbar"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { compareDateDesc, compareName, getProductDate } from "@/lib/product"
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearchesSnapshot,
  parseRecentSearches,
  subscribeRecentSearches
} from "@/lib/recent-searches"
import {
  countCategories,
  createFallbackIndex,
  createSearchIndex,
  findRelated,
  SEARCH_FOCUS_RESULTS_EVENT,
  SEARCH_RESULT_SELECTOR,
  type SearchDoc
} from "@/lib/search"
import { readSearchState, type SearchSort } from "@/lib/search-params"
import { writeSearchParams } from "@/lib/url"
import type { Category, Product } from "@/lib/types"

interface SearchResultsProps {
  products: readonly Product[]
  featured: readonly Product[]
  categories: readonly Category[]
  categoryCounts: Record<string, number>
}

/** 「也许相关」最多列出的条数：是提示而不是第二份结果列表。 */
const FALLBACK_LIMIT = 6

/** 查询词静默多久算「一次搜索意图」，值得写进最近搜索。 */
const SETTLE_MS = 800

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

/**
 * 搜索结果：三种状态各有一个主角 ——
 *
 * - **空查询** → `SearchLanding`：最近搜索 / 试试这些 / 按分类浏览；
 * - **有结果** → `SearchToolbar`（分类 facet + 排序）+ 结果行，行内给出命中上下文；
 * - **未找到** → `SearchNoResults`：「也许你想找」（放宽阈值）+ 换词建议 + 分类。
 *
 * 所有状态切换都只写 URL（`replaceState`，零网络往返），结果同帧更新。
 */
export function SearchResults({ products, featured, categories, categoryCounts }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { query, category, sort } = readSearchState(searchParams)
  const trimmedQuery = query.trim()

  const categoryNames = useMemo(
    () => Object.fromEntries(categories.map((c) => [c.id, c.name])) as Record<string, string>,
    [categories]
  )

  const searchIndex = useMemo(() => createSearchIndex(products, categoryNames), [products, categoryNames])
  const fallbackIndex = useMemo(() => createFallbackIndex(products, categoryNames), [products, categoryNames])

  /** 相关度打分结果（尚未按分类筛选）。 */
  const scored = useMemo(() => (trimmedQuery ? searchIndex.search(trimmedQuery) : []), [trimmedQuery, searchIndex])

  const facets = useMemo<SearchFacet[]>(
    () =>
      countCategories(scored.map((r) => r.item)).map((facet) => ({
        id: facet.id,
        label: categoryNames[facet.id] ?? facet.id,
        count: facet.count
      })),
    [scored, categoryNames]
  )

  // 分类筛选只在它仍出现在本次命中里时生效。换了查询词后旧分类会自然失效 ——
  // 这里用「派生」而不是 effect 去清 URL，避免先闪一帧空结果。
  const activeCategory = category && facets.some((f) => f.id === category) ? category : ""

  const results = useMemo<SearchDoc[]>(() => {
    const base = activeCategory ? scored.filter((r) => r.item.categories.includes(activeCategory)) : scored
    const items = base.map((r) => r.item)
    if (sort === "relevance") return items
    return [...items].sort(
      sort === "latest"
        ? (a, b) => compareDateDesc(getProductDate(a), getProductDate(b)) || compareName(a, b)
        : compareName
    )
  }, [scored, activeCategory, sort])

  /** 也许相关：只在「一条都没中」时才用宽松阈值再搜一次，并卡住分数避免硬凑噪音。 */
  const fallback = useMemo<SearchDoc[]>(() => {
    if (!trimmedQuery || scored.length > 0) return []
    return findRelated(fallbackIndex, trimmedQuery, FALLBACK_LIMIT)
  }, [trimmedQuery, scored.length, fallbackIndex])

  // 不同搜索词 → 不同推荐；同 URL 稳定。种子两端一致，故无重排闪烁。
  const displayedFeatured = useMemo(() => shuffleWithSeed(featured, hashString(trimmedQuery)), [featured, trimmedQuery])
  const suggestions = useMemo(() => displayedFeatured.slice(0, 5).map((p) => p.name), [displayedFeatured])

  // 最近搜索：只在客户端可得，服务端快照恒为空，hydration 后自然补上
  const recentRaw = useSyncExternalStore(subscribeRecentSearches, getRecentSearchesSnapshot, () => "[]")
  const recent = useMemo(() => parseRecentSearches(recentRaw), [recentRaw])

  // 查询词静默一段时间且确实有结果，才算一次值得记住的搜索 ——
  // 否则会把「c / cl / cla…」这些打字中间态灌满历史。
  const settledQuery = useDebouncedValue(trimmedQuery, SETTLE_MS)
  useEffect(() => {
    if (settledQuery && scored.length > 0) addRecentSearch(settledQuery)
  }, [settledQuery, scored.length])

  const patch = useCallback(
    (next: Record<string, string | null>) => {
      writeSearchParams(pathname, window.location.search, next)
    },
    [pathname]
  )

  const handlePick = useCallback((next: string) => patch({ q: next, cat: null }), [patch])
  const handleCategoryChange = useCallback((id: string) => patch({ cat: id }), [patch])
  const handleSortChange = useCallback(
    (next: SearchSort) => patch({ sort: next === "relevance" ? null : next }),
    [patch]
  )
  const handleClearRecent = useCallback(() => clearRecentSearches(), [])

  // 顶栏搜索框按 ↓ → 焦点进入第一条结果（两者无共同祖先，用全局事件解耦）
  useEffect(() => {
    const onFocusResults = () => document.querySelector<HTMLElement>(SEARCH_RESULT_SELECTOR)?.focus()
    window.addEventListener(SEARCH_FOCUS_RESULTS_EVENT, onFocusResults)
    return () => window.removeEventListener(SEARCH_FOCUS_RESULTS_EVENT, onFocusResults)
  }, [])

  /** 结果列表内 ↑↓ 在行之间移动焦点（行本身是可聚焦的 <a>）。 */
  const handleListKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return
    const rows = Array.from(e.currentTarget.querySelectorAll<HTMLElement>(SEARCH_RESULT_SELECTOR))
    const current = rows.indexOf(document.activeElement as HTMLElement)
    if (current === -1) return
    const next = e.key === "ArrowDown" ? Math.min(current + 1, rows.length - 1) : Math.max(current - 1, 0)
    if (next === current) return
    e.preventDefault()
    rows[next].focus()
  }

  if (!trimmedQuery) {
    return (
      <SearchLanding
        recent={recent}
        onClearRecent={handleClearRecent}
        suggestions={suggestions}
        categories={categories}
        categoryCounts={categoryCounts}
        onPick={handlePick}
      />
    )
  }

  if (scored.length === 0) {
    return (
      <SearchNoResults
        query={trimmedQuery}
        fallback={fallback}
        featured={displayedFeatured}
        suggestions={suggestions}
        categories={categories}
        categoryCounts={categoryCounts}
        categoryNames={categoryNames}
        onPick={handlePick}
      />
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SearchToolbar
        facets={facets}
        shown={results.length}
        total={scored.length}
        category={activeCategory}
        onCategoryChange={handleCategoryChange}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <div onKeyDown={handleListKeyDown} className="overflow-hidden rounded-lg border bg-card">
        {results.map((product, i) => (
          <SearchResultRow
            key={product.id}
            product={product}
            query={trimmedQuery}
            categoryNames={categoryNames}
            last={i === results.length - 1}
          />
        ))}
      </div>

      <p className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" aria-hidden />
        没有想要的？试试
        <Link href="/" className="text-foreground underline-offset-4 hover:underline">
          浏览全部工具
        </Link>
      </p>
    </div>
  )
}
