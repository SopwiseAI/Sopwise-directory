"use client"

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Sparkles } from "lucide-react"
import { FilterSelect } from "@/components/ui/filter-select"
import { SearchLanding } from "@/components/search/search-landing"
import { SearchNoResults } from "@/components/search/search-no-results"
import { SearchResultRow } from "@/components/search/search-result-row"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatCount } from "@/lib/format"
import { compareDateDesc, compareName, getToolDate } from "@/lib/tool"
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearchesSnapshot,
  parseRecentSearches,
  subscribeRecentSearches,
} from "@/lib/recent-searches"
import {
  createFallbackIndex,
  createSearchIndex,
  findRelated,
  SEARCH_FOCUS_RESULTS_EVENT,
  SEARCH_RESULT_SELECTOR,
  type SearchDoc,
} from "@/lib/search"
import { readSearchState, SEARCH_SORT_OPTIONS, type SearchSort } from "@/lib/search-params"
import { writeSearchParams } from "@/lib/url"
import type { Topic, Tool } from "@/lib/types"

interface SearchResultsProps {
  tools: readonly Tool[]
  featured: readonly Tool[]
  topics: readonly Topic[]
  topicCounts: Record<string, number>
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
 * - **空查询** → `SearchLanding`：最近搜索 / 试试这些 / 按主题浏览；
 * - **有结果** → 计数 + 排序 + 结果行，行内给出命中上下文；
 * - **未找到** → `SearchNoResults`：「也许你想找」（放宽阈值）+ 换词建议 + 主题。
 *
 * 所有状态切换都只写 URL（`replaceState`，零网络往返），结果同帧更新。
 */
export function SearchResults({ tools, featured, topics, topicCounts }: SearchResultsProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { query, sort } = readSearchState(searchParams)
  const trimmedQuery = query.trim()

  const topicNames = useMemo(
    () => Object.fromEntries(topics.map((c) => [c.id, c.name])) as Record<string, string>,
    [topics],
  )

  const searchIndex = useMemo(() => createSearchIndex(tools, topicNames), [tools, topicNames])
  const fallbackIndex = useMemo(() => createFallbackIndex(tools, topicNames), [tools, topicNames])

  const scored = useMemo(() => (trimmedQuery ? searchIndex.search(trimmedQuery) : []), [trimmedQuery, searchIndex])

  const results = useMemo<SearchDoc[]>(() => {
    const items = scored.map((r) => r.item)
    if (sort === "relevance") return items
    return [...items].sort(
      sort === "latest" ? (a, b) => compareDateDesc(getToolDate(a), getToolDate(b)) || compareName(a, b) : compareName,
    )
  }, [scored, sort])

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
    [pathname],
  )

  const handlePick = useCallback((next: string) => patch({ q: next }), [patch])
  const handleSortChange = useCallback(
    (next: SearchSort) => patch({ sort: next === "relevance" ? null : next }),
    [patch],
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
        topics={topics}
        topicCounts={topicCounts}
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
        topics={topics}
        topicCounts={topicCounts}
        topicNames={topicNames}
        onPick={handlePick}
      />
    )
  }

  const currentSort = SEARCH_SORT_OPTIONS.find((o) => o.value === sort) ?? SEARCH_SORT_OPTIONS[0]

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        {/* 中文句子里的元素切分不要留空格：`{" "}` 或行内尾随空格会渲染成「个与 「对话」 相关」 */}
        <p role="status" aria-live="polite" className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
          找到 <span className="font-data font-medium text-foreground">{formatCount(results.length)}</span> 个与
          <span className="font-medium text-foreground">「{trimmedQuery}」</span>相关的结果
        </p>
        <FilterSelect
          label="排序"
          icon={currentSort.icon}
          value={sort}
          options={SEARCH_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          onChange={(value) => handleSortChange(value as SearchSort)}
          active={sort !== "relevance"}
        />
      </div>

      <div onKeyDown={handleListKeyDown} className="overflow-hidden rounded-lg border bg-card">
        {results.map((tool, i) => (
          <SearchResultRow
            key={tool.id}
            tool={tool}
            query={trimmedQuery}
            topicNames={topicNames}
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
