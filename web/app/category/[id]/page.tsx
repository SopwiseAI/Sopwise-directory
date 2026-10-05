import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllCategories, getCategoryById, getProductsByCategory } from "@/lib/data"
import { latestProductDate } from "@/lib/product"
import { categoryIconNode } from "@/lib/category-icon-node"
import { formatCount, formatDate } from "@/lib/format"
import { getBaseUrl } from "@/lib/utils"
import { ProductBrowser } from "@/components/product/product-browser"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map((category) => ({
    id: category.id
  }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) return { title: "分类未找到", robots: { index: false, follow: true } }
  const description = `发现和浏览${category.name}类别的 AI 工具，XiGee 为你精选最佳选择`
  const empty = getProductsByCategory(id).length === 0
  return {
    title: `${category.name}`,
    description,
    alternates: { canonical: `/category/${id}` },
    openGraph: { title: `${category.name} — XiGee`, description },
    ...(empty ? { robots: { index: false, follow: true } } : {})
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) notFound()

  const products = getProductsByCategory(id)
  const latestDate = latestProductDate(products)

  const baseUrl = getBaseUrl()
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "全部工具", item: baseUrl },
      { "@type": "ListItem", position: 2, name: category.name, item: `${baseUrl}/category/${id}` }
    ]
  }
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} — XiGee`,
    itemListElement: products.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: p.url
    }))
  }
  // JSON-LD 注入前转义 `<`，避免产品/分类名中的 </script> 提前闭合脚本标签
  const ld = (obj: unknown) => JSON.stringify(obj).replace(/</g, "\\u003c")

  return (
    <div className="space-y-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(breadcrumbLd) }} />
      {products.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld(itemListLd) }} />
      )}

      <h1 className="sr-only">{category.name}</h1>

      <ProductBrowser
        products={products}
        categories={getAllCategories()}
        defaultView="grid"
        showTabs={false}
        emptyTitle={`「${category.name}」分类暂无工具收录`}
        emptyDescription="你可以浏览其他分类发现更多 AI 工具"
        title={
          <div className="flex min-w-0 items-center gap-3">
            <span
              key="icon"
              className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-card text-foreground"
            >
              {categoryIconNode(category.icon, "size-4")}
            </span>
            <span key="name" className="min-w-0 truncate text-base font-semibold tracking-tight">
              {category.name}
            </span>
            <span key="count" className="shrink-0 font-data text-xs font-normal text-muted-foreground">
              {formatCount(products.length)} 个工具
            </span>
            {latestDate && (
              <span
                key="date"
                className="hidden shrink-0 font-data text-xs font-normal text-muted-foreground/70 sm:inline"
              >
                · 最近更新 {formatDate(latestDate)}
              </span>
            )}
          </div>
        }
      />
    </div>
  )
}
