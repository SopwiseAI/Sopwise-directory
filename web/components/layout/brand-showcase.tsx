import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { getAllProducts, getAllCategories, getFeaturedProducts } from "@/lib/data"
import { formatCount } from "@/lib/format"
import { BrandMark } from "@/components/layout/brand-mark"

const products = getAllProducts()
const categories = getAllCategories()
const featured = getFeaturedProducts()

/** 首页 hero：克制的品牌定位 + 数据统计。简约即高级。 */
export function BrandShowcase() {
  const stats = [
    { label: "产品", value: products.length },
    { label: "分类", value: categories.length },
    { label: "精选", value: featured.length }
  ]

  return (
    <section className="rounded-xl border border-brand/15 bg-gradient-to-br from-brand/[0.04] to-brand/[0.01] dark:from-brand/[0.08] dark:to-brand/[0.03] px-6 py-8 sm:px-8">
      <div className="space-y-6">
        <div className="space-y-3">
          <p className="font-data uppercase tracking-[0.2em] text-muted-foreground">AI Discovery Engine</p>
          <div className="flex items-start gap-3">
            <BrandMark size="lg" className="size-12 rounded-xl shrink-0" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              XiGee
              <span className="ml-2 text-base font-normal text-muted-foreground sm:ml-3 sm:text-xl">
                你的 AI 发现引擎
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-brand/30" aria-hidden />
            <span className="size-1.5 rounded-full bg-brand/20" aria-hidden />
            <span className="size-1.5 rounded-full bg-brand/10" aria-hidden />
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
            精选的 AI 工具与产品导航。按分类浏览，或直接搜索你需要的能力。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-t pt-5">
          {stats.map(s => (
            <div key={s.label} className="flex items-baseline gap-2">
              <span className="font-mono text-lg tabular-nums">{formatCount(s.value)}</span>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
          <Link
            href="/?tab=featured"
            className="group inline-flex items-center gap-1 font-data text-muted-foreground transition-colors hover:text-brand outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            探索精选
            <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
