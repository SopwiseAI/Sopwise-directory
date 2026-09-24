import { getAllProducts, getProductDate } from "@/lib/data"
import { ProductBrowser } from "@/components/product/product-browser"
import { ProductCard } from "@/components/product/product-card"
import { ProductRow } from "@/components/product/product-row"
import { BrandShowcase } from "@/components/layout/brand-showcase"
import { formatCount } from "@/lib/format"

const products = getAllProducts()
const FEATURED_LIMIT = 6

function getLatest(limit: number) {
  return [...products].sort((a, b) => getProductDate(b).localeCompare(getProductDate(a))).slice(0, limit)
}

export default function Home() {
  const featured = products.filter(p => p.featured)
  const latest = getLatest(FEATURED_LIMIT)

  return (
    <div className="flex flex-col gap-8">
      <BrandShowcase />

      <section id="featured" className="space-y-3 scroll-mt-16">
        <SectionTitle
          index="01"
          title="精选推荐"
          hint={
            featured.length > 0
              ? featured.length > FEATURED_LIMIT
                ? `展示 ${formatCount(featured.length)} 个精选中的前 ${FEATURED_LIMIT} 个`
                : `${formatCount(featured.length)} 个精选产品`
              : "暂无精选产品，展示最新收录"
          }
        />
        <div className="product-card-grid">
          {(featured.length > 0 ? featured : latest).slice(0, FEATURED_LIMIT).map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle index="02" title="最新收录" hint="按产品成立时间排序" />
        <div className="rounded-lg border bg-card">
          {latest.map((product, i) => (
            <ProductRow key={product.id} product={product} last={i === latest.length - 1} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <SectionTitle index="03" title="全部产品" hint={`${formatCount(products.length)} 个产品`} />
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
