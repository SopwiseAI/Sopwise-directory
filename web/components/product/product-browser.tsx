"use client"

import { useMemo, useSyncExternalStore } from "react"
import type { Product } from "@/lib/types"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar, type SortMode, type ViewMode } from "@/components/product/product-toolbar"
import { PackageOpen } from "lucide-react"
import Link from "next/link"

interface ProductBrowserProps {
  products: Product[]
  emptyTitle?: string
  emptyDescription?: string
  defaultView?: ViewMode
}

/** URL 作为视图/排序的唯一状态源；replaceState 后派发事件通知订阅者重渲染 */
const NAV_EVENT = "ailulu:nav"

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    window.removeEventListener("popstate", callback)
    window.removeEventListener(NAV_EVENT, callback)
  }
}

/** 服务端/首帧快照：始终返回默认值，保证 hydration 与服务端 HTML 一致 */
function getServerSnapshot() {
  return ""
}

/** 客户端快照：实际 URL */
function getSnapshot() {
  if (typeof window === "undefined") return ""
  return window.location.pathname + window.location.search
}

/** 从快照字符串解析状态（不直接读 window，hydration 安全） */
function parseUrlSnapshot(snap: string): { view: ViewMode | null; sort: SortMode | null } {
  const qIndex = snap.indexOf("?")
  if (qIndex === -1) return { view: null, sort: null }
  const qs = new URLSearchParams(snap.slice(qIndex + 1))
  const view = qs.get("view") === "list" ? ("list" as ViewMode) : qs.get("view") === "grid" ? ("grid" as ViewMode) : null
  const sort = qs.get("sort") === "latest" ? ("latest" as SortMode) : qs.get("sort") === "recommended" ? ("recommended" as SortMode) : null
  return { view, sort }
}

function writeUrl(view: ViewMode, sort: SortMode, defaultView: ViewMode) {
  const params = new URLSearchParams(window.location.search)
  const changed = view !== defaultView || sort !== "recommended"
  if (changed) {
    params.set("view", view)
    params.set("sort", sort)
  } else {
    params.delete("view")
    params.delete("sort")
  }
  const qs = params.toString()
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  if (window.location.pathname + window.location.search === next) return
  window.history.replaceState(null, "", next)
  window.dispatchEvent(new Event(NAV_EVENT))
}

/**
 * 产品浏览区：视图/排序状态存于 URL（可刷新保留、可分享、后退/前进跟随）。
 * useSyncExternalStore：服务端与客户端首帧都用 server snapshot（默认 grid），
 * hydration 后 store 差异触发重渲染读取真实 URL —— 无 hydration mismatch。
 */
export function ProductBrowser({
  products,
  emptyTitle,
  emptyDescription,
  defaultView = "grid",
}: ProductBrowserProps) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { view: urlView, sort: urlSort } = parseUrlSnapshot(snap)
  const view: ViewMode = urlView ?? defaultView
  const sort: SortMode = urlSort ?? "recommended"

  const setView = (v: ViewMode) => writeUrl(v, sort, defaultView)
  const setSort = (s: SortMode) => writeUrl(view, s, defaultView)

  const sorted = useMemo(() => {
    const list = [...products]
    if (sort === "latest") {
      list.sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    } else {
      list.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false))
    }
    return list
  }, [products, sort])

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-center">
        <PackageOpen className="size-10 text-muted-foreground/60" />
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {emptyTitle ?? "暂无产品"}
          </p>
          {emptyDescription && (
            <p className="mt-1 text-xs text-muted-foreground">{emptyDescription}</p>
          )}
        </div>
        <Link href="/" className="mt-1 inline-flex items-center justify-center rounded-md border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring">
          浏览全部产品
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <ProductToolbar
        count={products.length}
        view={view}
        sort={sort}
        onViewChange={setView}
        onSortChange={setSort}
      />

      {view === "grid" ? (
        <div className="product-card-grid">
          {sorted.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {sorted.map((product, i) => (
            <ProductRow key={product.id} product={product} last={i === sorted.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}