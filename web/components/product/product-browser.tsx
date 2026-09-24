"use client"

import { useMemo, useSyncExternalStore } from "react"
import type { Product } from "@/lib/types"
import { getProductDate } from "@/lib/data"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar, type FilterMode, type ViewMode } from "@/components/product/product-toolbar"
import { PackageOpen } from "lucide-react"
import Link from "next/link"

interface ProductBrowserProps {
  products: Product[]
  emptyTitle?: string
  emptyDescription?: string
  defaultView?: ViewMode
}

const NAV_EVENT = "xigee:nav"

function subscribe(callback: () => void) {
  window.addEventListener("popstate", callback)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    window.removeEventListener("popstate", callback)
    window.removeEventListener(NAV_EVENT, callback)
  }
}

function getServerSnapshot() {
  return ""
}

function getSnapshot() {
  if (typeof window === "undefined") return ""
  return window.location.pathname + window.location.search
}

function parseUrlSnapshot(snap: string): { view: ViewMode | null; filter: FilterMode | null } {
  const qIndex = snap.indexOf("?")
  if (qIndex === -1) return { view: null, filter: null }
  const qs = new URLSearchParams(snap.slice(qIndex + 1))

  const viewMap: Record<string, ViewMode> = { list: "list", grid: "grid" }
  const filterMap: Record<string, FilterMode> = { latest: "latest", featured: "featured" }

  const viewParam = qs.get("view")
  const filterParam = qs.get("filter")

  const view = viewParam && viewParam in viewMap ? viewMap[viewParam] : null
  const filter = filterParam && filterParam in filterMap ? filterMap[filterParam] : null

  return { view, filter }
}

function writeUrl(view: ViewMode, filter: FilterMode, defaultView: ViewMode) {
  const params = new URLSearchParams(window.location.search)
  const changed = view !== defaultView || filter !== "latest"
  if (changed) {
    params.set("view", view)
    params.set("filter", filter)
  } else {
    params.delete("view")
    params.delete("filter")
  }
  const qs = params.toString()
  const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
  if (window.location.pathname + window.location.search === next) return
  window.history.replaceState(null, "", next)
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function ProductBrowser({ products, emptyTitle, emptyDescription, defaultView = "grid" }: ProductBrowserProps) {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { view: urlView, filter: urlFilter } = parseUrlSnapshot(snap)
  const view: ViewMode = urlView ?? defaultView
  const filter: FilterMode = urlFilter ?? "latest"

  const setView = (v: ViewMode) => writeUrl(v, filter, defaultView)
  const setFilter = (f: FilterMode) => writeUrl(view, f, defaultView)

  const filtered = useMemo(() => {
    if (filter === "featured") {
      return products.filter(p => p.featured)
    }
    return [...products].sort((a, b) => getProductDate(b).localeCompare(getProductDate(a)))
  }, [products, filter])

  if (filtered.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-3">
      <ProductToolbar
        count={filtered.length}
        view={view}
        filter={filter}
        onViewChange={setView}
        onFilterChange={setFilter}
      />

      {view === "grid" ? (
        <div className="product-card-grid">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {filtered.map((product, i) => (
            <ProductRow key={product.id} product={product} last={i === filtered.length - 1} />
          ))}
        </div>
      )}
    </div>
  )
}
