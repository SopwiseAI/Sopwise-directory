import type { Metadata } from "next"
import { Suspense } from "react"
import { getAllCategories, getAllProducts, getCategoryCounts, getFeaturedProducts } from "@/lib/data"
import { SearchResults } from "@/components/search/search-results"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = {
  title: "搜索",
  alternates: { canonical: "/search" },
  openGraph: { title: "搜索" },
  robots: { index: false, follow: true }
}

const allProducts = getAllProducts()
const featured = getFeaturedProducts()
const categories = getAllCategories()
const categoryCounts = getCategoryCounts()

/** 搜索结果为客户端计算（query 来自 URL），SSR 呈现同构骨架，避免「加载中…→结果」突兀跳变。 */
function ResultsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-5 w-44 rounded" />
      <div className="overflow-hidden rounded-lg border bg-card">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/4 rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">搜索</h1>
      <Suspense fallback={<ResultsSkeleton />}>
        <SearchResults
          products={allProducts}
          featured={featured}
          categories={categories}
          categoryCounts={categoryCounts}
        />
      </Suspense>
    </div>
  )
}
