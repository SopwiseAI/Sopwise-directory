import { getAllProducts, getAllCategories, getProductsByCategory } from "@/lib/data"
import { ProductBrowser } from "@/components/product/product-browser"
import { ProductCard } from "@/components/product/product-card"
import { ProductRow } from "@/components/product/product-row"
import { BrandShowcase } from "@/components/layout/brand-showcase"
import { RecentVisits } from "@/components/history/recent-visits"
import { categoryIconNode } from "@/lib/category-icon-node"
import { formatCount } from "@/lib/format"
import Link from "next/link"

const products = getAllProducts()
const categories = getAllCategories()

function getLatest(limit: number) {
  return [...products]
    .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
    .slice(0, limit)
}

export default function Home() {
  const featured = products.filter((p) => p.featured)
  const latest = getLatest(6)

  return (
    <div className="flex flex-col gap-8">
      <BrandShowcase />
      <RecentVisits />

      {featured.length > 0 && (
        <section id="featured" className="space-y-3 scroll-mt-16">
          <SectionTitle
            index="01"
            title="精选推荐"
            hint={
              featured.length > 6
                ? `展示 ${formatCount(featured.length)} 个精选中的前 6 个`
                : `${formatCount(featured.length)} 个精选产品`
            }
          />
          <div className="product-card-grid">
            {featured.slice(0, 6).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <SectionTitle index="02" title="最新收录" hint="按产品成立时间排序" />
        <div className="rounded-lg border bg-card">
          {latest.map((product, i) => (
            <ProductRow key={product.id} product={product} last={i === latest.length - 1} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle index="03" title="浏览分类" hint={`${formatCount(categories.length)} 个分类`} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category) => {
            const count = formatCount(getProductsByCategory(category.id).length)
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className="group flex items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:bg-secondary/40 hover:border-foreground/20 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-muted-foreground transition-colors group-hover:text-foreground">{categoryIconNode(category.id)}</span>
                <span className="truncate text-sm">{category.name}</span>
                <span className="ml-auto font-data tabular-nums text-muted-foreground">{count}</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle index="04" title="全部产品" hint={`${formatCount(products.length)} 个产品`} />
        <ProductBrowser products={products} />
      </section>
    </div>
  )
}

function SectionTitle({ index, title, hint }: { index: string; title: string; hint?: string }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <span className="font-data text-muted-foreground">{index}</span>
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {hint && <span className="font-data text-muted-foreground">{hint}</span>}
    </div>
  )
}