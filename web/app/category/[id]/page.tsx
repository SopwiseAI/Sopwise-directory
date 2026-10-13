import { type Metadata } from "next"
import { notFound } from "next/navigation"
import { getAllCategories, getCategoryById, getProductsByCategory } from "@/lib/data"
import { latestProductDate } from "@/lib/product"
import { categoryIconNode } from "@/lib/category-icon-node"
import { formatCount, formatDate } from "@/lib/format"
import { resolveCrumbs } from "@/lib/breadcrumbs"
import { absoluteUrl, breadcrumbLd, buildCategoryDescription, itemListLd } from "@/lib/seo"
import { categoryHref, toolHref } from "@/lib/url"
import { JsonLd } from "@/components/seo/json-ld"
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

// 注：dynamicParams=false 时，未在 generateStaticParams 中列出的 id 由 Next 直接 404，
// 下面 generateMetadata 的「分类未找到」分支与页面里的 notFound() 实际不会执行
// —— 仅作类型收窄与数据意外缺失时的防御保留。

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) return { title: "分类未找到", robots: { index: false, follow: true } }

  const products = getProductsByCategory(id)
  // 描述来自 studio 导出的 sd_category.description；上游没填时才落到兜底文案
  const description = category.description ?? buildCategoryDescription(category, products.length)

  return {
    title: `${category.name}`,
    description,
    alternates: { canonical: categoryHref(id) },
    openGraph: { title: `${category.name} — XiGee`, description },
    ...(products.length === 0 ? { robots: { index: false, follow: true } } : {})
  }
}

export default async function CategoryPage({ params }: Props) {
  const { id } = await params
  const category = getCategoryById(id)
  if (!category) notFound()

  const categories = getAllCategories()
  const products = getProductsByCategory(id)
  const latestDate = latestProductDate(products)

  const pageUrl = absoluteUrl(categoryHref(id))
  const crumbs = resolveCrumbs(categoryHref(id), { categories })
  // ItemList 指向站内详情页（此前指向外部官网 —— 等于告诉 Google 列表条目在别的域名上）
  const listItems = products.map((product) => ({
    name: product.name,
    url: absoluteUrl(toolHref(product.id))
  }))

  return (
    <div className="flex flex-col gap-4">
      <JsonLd data={breadcrumbLd(crumbs, pageUrl)} />
      {listItems.length > 0 && <JsonLd data={itemListLd(`${category.name} — XiGee`, listItems)} />}

      <ProductBrowser
        products={products}
        categories={categories}
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
            {/* 分类名即本页 h1（放进二级栏视觉标题位，不再另设 sr-only h1）；数量/日期为附属信息 */}
            <h1 key="name" className="min-w-0 truncate text-base font-semibold tracking-tight">
              {category.name}
            </h1>
            {/* 窄屏二级栏空间有限：数量让位给分类名（分类条里本来就带数量） */}
            <span key="count" className="hidden shrink-0 font-data text-xs font-normal text-muted-foreground sm:inline">
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

      {/*
        分类描述放在网格之后：二级栏必须紧贴顶栏保持单行形态，正文插到它前面会把「栏」挤开。
        只有上游真填了 description 才渲染 —— 兜底文案二十个分类一模一样，摆到页面上就是模板噪音。
      */}
      {category.description && (
        <section className="flex flex-col gap-1.5 border-t border-border pt-4">
          <h2 className="text-sm font-semibold">关于「{category.name}」</h2>
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{category.description}</p>
        </section>
      )}
    </div>
  )
}
