import { type Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getAllCategories, getCategoryById, getProductsByCategory, getProductDate } from "@/lib/data"
import { categoryIconNode } from "@/lib/category-icon-node"
import { formatCount } from "@/lib/format"
import { ProductBrowser } from "@/components/product/product-browser"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateStaticParams() {
  const categories = getAllCategories()
  return categories.map(category => ({
    id: category.id
  }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) return { title: "分类未找到" }
  return {
    title: `${category.name}`,
    description: `发现和浏览${category.name}类别的 AI 产品，XiGee 为你精选最佳工具`
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) notFound()

  const products = getProductsByCategory(id)
  const latestDate = products.reduce<string | null>((max, p) => {
    const date = getProductDate(p)
    if (!date) return max
    return max === null || date > max ? date : max
  }, null)

  return (
    <div className="space-y-4">
      <nav aria-label="面包屑" className="font-data text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          全部产品
        </Link>
        <span className="mx-1.5">/</span>
        <span>{category.name}</span>
      </nav>
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-card">
          {categoryIconNode(category.id, "size-4.5 text-foreground")}
        </div>
        <div className="min-w-0">
          <h1 className="flex items-baseline gap-2 text-lg font-semibold tracking-tight">
            {category.name}
            <span className="font-data font-normal text-muted-foreground">{formatCount(products.length)} 个产品</span>
          </h1>
          {latestDate && <p className="font-data text-muted-foreground">最近更新 {latestDate}</p>}
        </div>
      </div>

      <ProductBrowser
        products={products}
        defaultView="grid"
        emptyTitle={`「${category.name}」分类暂无产品收录`}
        emptyDescription="你可以浏览其他分类发现更多 AI 产品"
      />
    </div>
  )
}
