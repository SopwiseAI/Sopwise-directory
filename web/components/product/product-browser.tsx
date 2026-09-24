"use client"

import { useMemo, useState, useEffect } from "react"
import type { Product } from "@/lib/types"
import { getProductDate } from "@/lib/data"
import { ProductRow } from "@/components/product/product-row"
import { ProductCard } from "@/components/product/product-card"
import { ProductToolbar, type TabMode, type SortMode, type ViewMode } from "@/components/product/product-toolbar"
import { PackageOpen } from "lucide-react"
import Link from "next/link"

interface ProductBrowserProps {
  products: Product[]
  emptyTitle?: string
  emptyDescription?: string
  defaultView?: ViewMode
  showTabs?: boolean
  defaultTab?: TabMode
}

function readUrlParams() {
  if (typeof window === "undefined") return { tab: null as TabMode | null, view: null as ViewMode | null }
  const qs = new URLSearchParams(window.location.search)
  const tabParam = qs.get("tab")
  const filterParam = qs.get("filter")
  const viewParam = qs.get("view")

  const validTabs: Record<string, TabMode> = { all: "all", latest: "latest", featured: "featured" }
  const validViews: Record<string, ViewMode> = { list: "list", grid: "grid" }
  const filterToTab: Record<string, TabMode> = { featured: "featured", latest: "all" }

  const tab =
    tabParam && tabParam in validTabs
      ? validTabs[tabParam]
      : filterParam && filterParam in filterToTab
        ? filterToTab[filterParam]
        : null
  const view = viewParam && viewParam in validViews ? validViews[viewParam] : null

  return { tab, view }
}

export function ProductBrowser({
  products,
  emptyTitle,
  emptyDescription,
  defaultView = "grid",
  showTabs = true,
  defaultTab = "all"
}: ProductBrowserProps) {
  const urlParams = readUrlParams()
  const urlTab = urlParams.tab ?? defaultTab
  const urlView = urlParams.view

  const [sort, setSort] = useState<SortMode>("latest")
  const [view, setViewState] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return defaultView
    const stored = localStorage.getItem("xigee:default-view") as ViewMode | null
    return urlView ?? (stored === "list" || stored === "grid" ? stored : defaultView)
  })
  const [tab, setTabState] = useState<TabMode>(urlTab)

  useEffect(() => {
    if (!showTabs) return
    const params = new URLSearchParams(window.location.search)
    const changed: string[] = []

    if (tab !== defaultTab) {
      params.set("tab", tab)
      changed.push("tab")
    } else {
      params.delete("tab")
      params.delete("filter")
      changed.push("tab")
    }

    if (view !== defaultView) {
      params.set("view", view)
      changed.push("view")
    } else {
      params.delete("view")
      changed.push("view")
    }

    if (changed.length > 0) {
      const qs = params.toString()
      const next = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
      window.history.replaceState(null, "", next)
    }
  }, [tab, view, defaultTab, defaultView, showTabs])

  const isLatestTab = tab === "latest"
  const resolvedSort: SortMode = isLatestTab ? "latest" : sort

  const setView = (v: ViewMode) => {
    localStorage.setItem("xigee:default-view", v)
    setViewState(v)
  }

  const setTab = (t: TabMode) => {
    setTabState(t)
    if (t !== "latest") {
      setSort("latest")
    }
  }

  const filtered = useMemo(() => {
    const list = tab === "featured" ? products.filter(p => p.featured) : [...products]
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
    <div className="space-y-4">
      <ProductToolbar
        count={filtered.length}
        view={view}
        tab={tab}
        sort={sort}
        showTabs={showTabs}
        onViewChange={setView}
        onTabChange={setTab}
        onSortChange={setSort}
      />

      {view === "grid" ? (
        <div className="product-card-grid">
          {filtered.map(product => (
            <ProductCard key={product.id} product={product} showDate={isLatestTab} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          {filtered.map((product, i) => (
            <ProductRow key={product.id} product={product} last={i === filtered.length - 1} showDate={isLatestTab} />
          ))}
        </div>
      )}
    </div>
  )
}
