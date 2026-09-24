"use client"

import { useMemo, useSyncExternalStore } from "react"
import Link from "next/link"
import { Clock } from "lucide-react"
import { getHistorySnapshot, subscribeHistory, type HistoryItem } from "@/lib/history"
import { getAllProducts } from "@/lib/data"
import { ProductIcon } from "@/components/product/product-icon"
import { getDomain } from "@/lib/product-icon"

const allProducts = getAllProducts()
const productById = new Map(allProducts.map(p => [p.id, p]))

/** 首页「最近访问」：本地历史的快速回归入口（仅展示有对应产品的条目） */
export function RecentVisits({ limit = 4 }: { limit?: number }) {
  const raw = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => "[]")

  const items = useMemo<HistoryItem[]>(() => {
    try {
      const list = JSON.parse(raw) as HistoryItem[]
      if (!Array.isArray(list)) return []
      return list.filter(i => productById.has(i.id)).slice(0, limit)
    } catch {
      return []
    }
  }, [raw, limit])

  if (items.length === 0) return null

  return (
    <section className="space-y-3">
      <div className="flex items-baseline gap-2.5">
        <span className="font-data text-muted-foreground">·</span>
        <h2 className="text-base font-semibold tracking-tight">最近访问</h2>
        <Link
          href="/history"
          className="font-data text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
        >
          查看全部 →
        </Link>
      </div>
      <div className="rounded-lg border bg-card">
        {items.map((item, i) => {
          const product = productById.get(item.id)
          if (!product) return null
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              data-history-id={item.id}
              data-history-name={item.name}
              data-history-url={item.url}
              data-history-category={item.categoryId}
              data-history-pricing={item.pricing ?? ""}
              className={`group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-secondary/40 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset ${
                i !== items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <ProductIcon
                name={product.name}
                url={product.url}
                icon={product.icon}
                className="h-7 w-7 rounded-md border"
                imgClassName="h-7 w-7"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{product.name}</p>
                <p className="truncate font-data text-muted-foreground">{getDomain(product.url)}</p>
              </div>
              <Clock className="size-3.5 shrink-0 text-muted-foreground/50" />
            </a>
          )
        })}
      </div>
    </section>
  )
}
