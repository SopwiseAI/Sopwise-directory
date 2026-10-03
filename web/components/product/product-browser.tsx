"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode
} from "react"
import { useSearchParams } from "next/navigation"
import type { Category, Product } from "@/lib/types"
import { compareName, compareRecommended, getProductDate } from "@/lib/product"
import {
  getSort,
  getTab,
  getView,
  setSort as persistSort,
  setView as persistView,
  subscribePreferences
} from "@/lib/preferences"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar } from "@/components/product/toolbar"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { readUrlParams, type SortMode, type TabMode, type UrlState, type ViewMode } from "@/lib/product-query"
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
  /** 无 tabs 页面（分类页）工具栏左侧的自定义内容，如分类图标 + 名称。 */
  title?: ReactNode
  /** 分类真源（id → 名称/图标），用于卡片/列表展示分类。缺省则只显示域名。 */
  categories?: readonly Category[]
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

function getUrlSearch(): string {
  if (typeof window === "undefined") return emptyString
  return window.location.search
}

export function ProductBrowser({
  products,
  emptyTitle,
  emptyDescription,
  defaultView = "grid",
  defaultSort = "recommended",
  showTabs = true,
  defaultTab = "all",
  title,
  categories
}: ProductBrowserProps) {
  // 每实例唯一前缀：避免同页多实例（或 SSR/客户端）产生重复 DOM id 与错位的 aria 关联
  const uid = useId()
  const panelId = `${uid}-panel`

  const storedViewRaw = useSyncExternalStore(subscribePreferences, getView, () => null)
  const storedSortRaw = useSyncExternalStore(subscribePreferences, getSort, () => null)
  const storedTabRaw = useSyncExternalStore(subscribePreferences, getTab, () => null)
  const urlSearch = useSyncExternalStore(noopSubscribe, getUrlSearch, () => emptyString)
  const mounted = useSyncExternalStore(noopSubscribe, mountedSnapshot, notMountedSnapshot)

  // 挂载前一律忽略本地偏好：SSG 服务端读不到 localStorage，若客户端首次渲染就用偏好值
  // 会导致排序/视图与 SSR 不一致（hydration mismatch）。故挂载后才应用。
  const storedView = mounted ? storedViewRaw : null
  const storedSort = mounted ? storedSortRaw : null
  const storedTab = mounted ? storedTabRaw : null

  const initial = useMemo(() => readUrlParams(mounted ? urlSearch : ""), [urlSearch, mounted])
  const initialView = initial.view ?? storedView ?? defaultView
  const initialSort = initial.sort ?? storedSort ?? defaultSort
  // 默认 Tab 仅在展示 Tab 的页面生效：否则（如分类页）会静默过滤产品却无切换入口
  const initialTab = initial.tab ?? (showTabs ? (storedTab ?? defaultTab) : defaultTab)

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

  // tab/view/sort 在 URL 上保持一致：仅在值与「当前 URL」不同时重写，避免与传入的
  // 链接参数（如 Hero 的 ?tab=all#product-browser）互相覆盖。
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const hadTab = params.has("tab")
    params.delete("filter") // 旧版别名，统一由 tab 表达
    // tab：值为默认值时通常不写入 URL；但若 URL 本就显式带 tab（如 ?tab=all），保留以示选中
    if (showTabs && (tab !== defaultTab || hadTab)) params.set("tab", tab)
    else params.delete("tab")
    if (view !== defaultView) params.set("view", view)
    else params.delete("view")
    // latest tab 隐含时间排序，URL 不写 sort 以免误导
    const effectiveSort = tab === "latest" ? "latest" : sort
    if (effectiveSort !== defaultSort) params.set("sort", effectiveSort)
    else params.delete("sort")

    const qs = params.toString()
    const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    const current = `${window.location.pathname}${window.location.search}`
    if (next !== current) window.history.replaceState(null, "", `${next}${window.location.hash}`)
  }, [tab, view, sort, defaultTab, defaultView, defaultSort, showTabs])

  const isLatestTab = tab === "latest"
  const resolvedSort: SortMode = isLatestTab ? "latest" : sort

  const setView = (v: ViewMode) => {
    persistView(v)
    setViewOverride(v)
  }

  const setSort = (s: SortMode) => {
    persistSort(s)
    setSortOverride(s)
  }

  // 切换 tab 不写入默认偏好：Tab 为会话级筛选（体现在 URL），「默认 Tab」仅在设置页修改
  const setTab = (t: TabMode) => {
    setTabOverride(t)
  }

  const filtered = useMemo(() => {
    const list = tab === "featured" ? products.filter((p) => p.featured) : [...products]
    switch (resolvedSort) {
      case "name-asc":
        list.sort(compareName)
        break
      case "name-desc":
        list.sort((a, b) => compareName(b, a))
        break
      case "latest":
        list.sort((a, b) => getProductDate(b).localeCompare(getProductDate(a)))
        break
      case "recommended":
        list.sort(compareRecommended)
        break
    }
    return list
  }, [products, tab, resolvedSort])

  // 分类 id→名称/图标 查找（供卡片/列表展示分类）；缺 categories 时返回空
  const categoryOf = useCallback(
    (product: Product) => {
      const id = product.categories[0]
      const cat = id ? categories?.find((c) => c.id === id) : undefined
      return { label: cat?.name ?? "", icon: cat?.icon }
    },
    [categories]
  )

  return (
    <div id="product-browser" className="scroll-mt-28 md:scroll-mt-8">
      <Suspense fallback={null}>
        <UrlStateSync onChange={applyUrlState} />
      </Suspense>
      <div className="space-y-4">
        {/* 空结果时仍展示工具栏，保住分类图标/名称等页面身份信息 */}
        <ProductToolbar
          view={view}
          tab={tab}
          sort={sort}
          showTabs={showTabs}
          panelId={panelId}
          title={title}
          onViewChange={setView}
          onTabChange={setTab}
          onSortChange={setSort}
        />

        {filtered.length === 0 ? (
          <Empty className="py-12">
            <EmptyMedia variant="icon">
              <PackageOpen />
            </EmptyMedia>
            <EmptyHeader>
              <EmptyTitle>{emptyTitle ?? "暂无产品"}</EmptyTitle>
              {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
            </EmptyHeader>
            <EmptyContent>
              <Button variant="outline" render={<Link href="/" />}>
                浏览全部产品
              </Button>
            </EmptyContent>
          </Empty>
        ) : showTabs ? (
          <div role="tabpanel" id={panelId} aria-label="产品列表">
            <BrowserContent view={view} products={filtered} categoryOf={categoryOf} />
          </div>
        ) : (
          <BrowserContent view={view} products={filtered} categoryOf={categoryOf} />
        )}
      </div>
    </div>
  )
}

function BrowserContent({
  view,
  products,
  categoryOf
}: {
  view: ViewMode
  products: readonly Product[]
  categoryOf: (product: Product) => { label: string; icon?: string }
}) {
  if (view === "grid") {
    return (
      <div className="product-card-grid">
        {products.map((product) => {
          const c = categoryOf(product)
          return <ProductCard key={product.id} product={product} categoryLabel={c.label} categoryIcon={c.icon} />
        })}
      </div>
    )
  }
  return (
    <div className="rounded-lg border bg-card">
      {products.map((product, i) => {
        const c = categoryOf(product)
        return (
          <ProductRow
            key={product.id}
            product={product}
            last={i === products.length - 1}
            categoryLabel={c.label}
            categoryIcon={c.icon}
          />
        )
      })}
    </div>
  )
}
