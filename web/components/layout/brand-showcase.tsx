import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getAllProducts, getAllCategories, getFeaturedProducts } from "@/lib/data"
import { formatCount } from "@/lib/format"

const products = getAllProducts()
const categories = getAllCategories()
const featured = getFeaturedProducts()

/** 首页 hero：克制的品牌定位 + 数据统计。简约即高级。 */
export function BrandShowcase() {
  const stats = [
    { label: "产品", value: products.length },
    { label: "分类", value: categories.length },
    { label: "精选", value: featured.length },
  ]

  return (
    <section className="rounded-xl border bg-card px-6 py-8 sm:px-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="font-data uppercase tracking-[0.2em] text-muted-foreground">
            AI Bookmark Directory
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            ailulu
            <span className="ml-2 text-base font-normal text-muted-foreground sm:ml-3 sm:text-xl">
              AI 产品书签
            </span>
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            精选的 AI 工具与产品导航。按分类浏览，或直接搜索你需要的能力。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t pt-5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="font-mono text-lg tabular-nums">{formatCount(s.value)}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
          <Link
            href="/#featured"
            className="group inline-flex items-center gap-1 font-data text-muted-foreground transition-colors hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            探索精选
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}