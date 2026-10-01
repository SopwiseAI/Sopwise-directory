"use client"

import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from "react"
import { useSearchParams } from "next/navigation"
import type { Product } from "@/lib/types"
import { getProductDate } from "@/lib/product"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar } from "@/components/product/toolbar"
import {
  isValidSort,
  isValidView,
  readUrlParams,
  type SortMode,
  type TabMode,
  type UrlState,
  type ViewMode
} from "@/lib/product-query"
import { PackageOpen } from "lucide-react"
import Link from "next/link"

interface ProductBrowserProps {
  products: readonly Product[]
  emptyTitle?: string
  emptyDescription?: string
  defaultView?: ViewMode
  defaultSort?: SortMode
  showTabs?: boolean
  defaultTab?: TabMode
}

/**
 * 订阅 URL 查询（含同路由软导航，如首页「探索精选」→ /?tab=featured）并同步进组件状态。
 * useSearchParams 需在 Suspense 边界内；该子组件不渲染内容，故不影响页面 SSR。
 */
function UrlStateSync({ onChange }: { onChange: (state: UrlState) => void }) {
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    onChange(readUrlParams(search))
  }, [search, onChange])

  return null
}

const noopSubscribe = () => () => {}
const emptyString = ""
const mountedSnapshot = () => true
const notMountedSnapshot = () => false

/** SSR 期退化为 useEffect，客户端用 useLayoutEffect 在首绘帧前揭示（避免中介帧闪烁）。 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect

function readStore(key: string): string {
  if (typeof window === "undefined") return emptyString
  try {
    return localStorage.getItem(key) ?? emptyString
  } catch {
    return emptyString
  }
}

const getStoredView = () => readStore("xigee:default-view")
const getStoredSort = () => readStore("xigee:default-sort")

function getUrlSearch(): string {
  if (typeof window === "undefined") return emptyString
  return window.location.search
}

/** 持久化展示偏好，忽略隐私模式/配额失败（当前会话仍然生效）。 */
function persist(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* noop */
  }
}

export function ProductBrowser({
  products,
  emptyTitle,
  emptyDescription,
  defaultView = "grid",
  defaultSort = "latest",
  showTabs = true,
  defaultTab = "all"
}: ProductBrowserProps) {
  const storedView = useSyncExternalStore(noopSubscribe, getStoredView, () => emptyString)
  const storedSort = useSyncExternalStore(noopSubscribe, getStoredSort, () => emptyString)
  const urlSearch = useSyncExternalStore(noopSubscribe, getUrlSearch, () => emptyString)
  const mounted = useSyncExternalStore(noopSubscribe, mountedSnapshot, notMountedSnapshot)

  const initial = useMemo(() => readUrlParams(urlSearch), [urlSearch])
  const initialView = initial.view ?? (isValidView(storedView) ? storedView : defaultView)
  const initialSort = initial.sort ?? (isValidSort(storedSort) ? storedSort : defaultSort)
  const initialTab = initial.tab ?? defaultTab

  const [viewOverride, setViewOverride] = useState<ViewMode | null>(null)
  const [sortOverride, setSortOverride] = useState<SortMode | null>(null)
  const [tabOverride, setTabOverride] = useState<TabMode | null>(null)

  const view = viewOverride ?? initialView
  const sort = sortOverride ?? initialSort
  const tab = tabOverride ?? initialTab

  // PB-01：首帧由 prefsScript 隐藏产品区（仅当偏好≠默认），hydration 应用真实偏好后揭示。
  // mounted 与 stored* 同由 useSyncExternalStore 驱动，同一次重渲染翻转，故揭示时偏好已就绪。
  useIsomorphicLayoutEffect(() => {
    if (!mounted) return
    document.documentElement.removeAttribute("data-prefs")
  }, [mounted, view, sort, tab])

  const applyUrlState = useCallback((state: UrlState) => {
    setTabOverride(state.tab)
    setViewOverride(state.view)
    setSortOverride(state.sort)
  }, [])

  // tab/view/sort 三者在 URL 上保持一致（tab 仅在有 tabs 的页面写入）
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.delete("filter") // 旧版别名，统一由 tab 表达
    if (showTabs && tab !== defaultTab) params.set("tab", tab)
    else params.delete("tab")
    if (view !== defaultView) params.set("view", view)
    else params.delete("view")
    // latest tab 下 resolvedSort 强制为 latest，URL 不写 sort 以免误导
    const effectiveSort = tab === "latest" ? defaultSort : sort
    if (effectiveSort !== defaultSort) params.set("sort", effectiveSort)
    else params.delete("sort")

    const qs = params.toString()
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    const current = `${window.location.pathname}${window.location.search}`
    if (next !== current) window.history.replaceState(null, "", next)
  }, [tab, view, sort, defaultTab, defaultView, defaultSort, showTabs])

  const isLatestTab = tab === "latest"
  const resolvedSort: SortMode = isLatestTab ? "latest" : sort

  const setView = (v: ViewMode) => {
    persist("xigee:default-view", v)
    setViewOverride(v)
  }

  const setSort = (s: SortMode) => {
    persist("xigee:default-sort", s)
    setSortOverride(s)
  }

  // 切换 tab 不再重置排序：排序为用户独立偏好（最新 tab 由 resolvedSort 强制最新）
  const setTab = (t: TabMode) => {
    setTabOverride(t)
  }

  const filtered = useMemo(() => {
    const list = tab === "featured" ? products.filter((p) => p.featured) : [...products]
    switch (resolvedSort) {
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name))
        break
      case "latest":
        list.sort((a, b) => getProductDate(b).localeCompare(getProductDate(a)))
        break
    }
    return list
  }, [products, tab, resolvedSort])

  return (
    <div id="product-browser">
      <Suspense fallback={null}>
        <UrlStateSync onChange={applyUrlState} />
      </Suspense>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <PackageOpen className="size-10 text-muted-foreground/60" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">{emptyTitle ?? "暂无产品"}</p>
            {emptyDescription && <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>}
          </div>
          <Link
            href="/"
            className="mt-1 inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            浏览全部产品
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <ProductToolbar
            view={view}
            tab={tab}
            sort={sort}
            showTabs={showTabs}
            onViewChange={setView}
            onTabChange={setTab}
            onSortChange={setSort}
          />

          {showTabs ? (
            <div role="tabpanel" id="product-tabpanel" aria-labelledby={`product-tab-${tab}`}>
              <BrowserContent view={view} products={filtered} showDate={resolvedSort === "latest"} />
            </div>
          ) : (
            <BrowserContent view={view} products={filtered} showDate={resolvedSort === "latest"} />
          )}
        </div>
      )}
    </div>
  )
}

function BrowserContent({
  view,
  products,
  showDate
}: {
  view: ViewMode
  products: readonly Product[]
  showDate: boolean
}) {
  if (view === "grid") {
    return (
      <div className="product-card-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} showDate={showDate} />
        ))}
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-card">
      {products.map((product, i) => (
        <ProductRow key={product.id} product={product} last={i === products.length - 1} showDate={showDate} />
      ))}
    </div>
  )
}
