"use client"

import { useMemo, useState, useEffect, useSyncExternalStore } from "react"
import type { Product } from "@/lib/types"
import { getProductDate } from "@/lib/data"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar, type FilterMode, type SortMode, type ViewMode } from "@/components/product/product-toolbar"
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
  sessionStorage.setItem("xigee:product-browser-state", JSON.stringify({ view, filter }))
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

export function ProductBrowser({ products, emptyTitle, emptyDescription, defaultView }: ProductBrowserProps) {
  const [sort, setSort] = useState<SortMode>("latest")
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const { view: urlView, filter: urlFilter } = parseUrlSnapshot(snap)

  const [initialView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return defaultView ?? "grid"
    const saved = localStorage.getItem("xigee:default-view") as ViewMode | null
    if (saved === "list" || saved === "grid") return saved
    return defaultView ?? "grid"
  })

  useEffect(() => {
    if (urlView || urlFilter) return
    const saved = sessionStorage.getItem("xigee:product-browser-state")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved)
      if (parsed.view || parsed.filter) {
        const params = new URLSearchParams(window.location.search)
        if (parsed.view && !params.has("view")) params.set("view", parsed.view)
        if (parsed.filter && !params.has("filter")) params.set("filter", parsed.filter)
        const qs = params.toString()
        const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
        window.history.replaceState(null, "", next)
        window.dispatchEvent(new Event(NAV_EVENT))
      }
    } catch {
      /* ignore */
    }
  }, [urlView, urlFilter])

  const resolvedView = urlView ?? initialView
  const view = resolvedView as ViewMode
  const filter: FilterMode = urlFilter ?? "latest"

  const setView = (v: ViewMode) => {
    localStorage.setItem("xigee:default-view", v)
    writeUrl(v, filter, defaultView ?? "grid")
  }
  const setFilter = (f: FilterMode) => writeUrl(view, f, defaultView ?? "grid")

  const filtered = useMemo(() => {
    const list = filter === "featured" ? products.filter(p => p.featured) : [...products]
    switch (sort) {
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
  }, [products, filter, sort])

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
        sort={sort}
        onViewChange={setView}
        onFilterChange={setFilter}
        onSortChange={setSort}
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
