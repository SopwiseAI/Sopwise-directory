import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { getAllCategories, getAllProducts, getProductById } from "@/lib/data"
import { formatDate } from "@/lib/format"
import { getProductDate, getRelatedProducts, productHistoryAttrs } from "@/lib/product"
import { resolveCrumbs } from "@/lib/breadcrumbs"
import { absoluteUrl, breadcrumbLd, buildToolDescription, softwareApplicationLd } from "@/lib/seo"
import { categoryHref, getDomain, toolHref } from "@/lib/url"
import { pageShell } from "@/lib/layout"
import { categoryIconNode } from "@/lib/category-icon-node"
import { JsonLd } from "@/components/seo/json-ld"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PricingBadge } from "@/components/product/pricing-badge"
import { ProductRow } from "@/components/product/product-row"

type Props = {
  params: Promise<{ slug: string }>
}

/** 全部产品预渲染 —— 这 85 个页面是本站长尾流量的主入口。 */
export async function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.id }))
}

/** 未收录的 slug 直接 404，不生成无限 URL 空间。 */
export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = getProductById(slug)
  if (!product) return { title: "工具未找到", robots: { index: false, follow: true } }

  const category = getAllCategories().find((c) => c.id === product.categories[0])
  const description = buildToolDescription(product, category?.name)

  return {
    title: product.name,
    description,
    alternates: { canonical: toolHref(slug) },
    openGraph: { title: `${product.name} — XiGee`, description, type: "article" }
  }
}

/**
 * 产品详情页。
 *
 * 这是目录站的核心 SEO 资产：在此之前 85 个产品只有名称挤在首页的 `<h2>` 里，
 * 没有独立 URL、没有内链、`ItemList` 只能指向外部域名。现在每个产品都有
 * canonical + `SoftwareApplication` 结构化数据 + 站内链接（分类、相关工具）。
 *
 * 出站入口保留在显眼位置（`直达官网` 按钮），但**卡片与列表的点击面先进本站**，
 * 让链接权重在站内流转而不是全部外泄。
 */
export default async function ToolPage({ params }: Props) {
  const { slug } = await params
  const product = getProductById(slug)
  if (!product) notFound()

  const categories = getAllCategories()
  const categoryId = product.categories[0]
  const category = categoryId ? categories.find((c) => c.id === categoryId) : undefined

  const pageUrl = absoluteUrl(toolHref(slug))
  const crumbs = resolveCrumbs(`/tool/${slug}`, { categories, products: getAllProducts() })
  const related = getRelatedProducts(product, getAllProducts(), 5)
  const date = getProductDate(product)
  const domain = getDomain(product.url)
  const tags = product.tags ?? []

  return (
    <div className={pageShell("content", "flex flex-col gap-6")} data-tool-detail={product.id}>
      <JsonLd data={breadcrumbLd(crumbs, pageUrl)} />
      <JsonLd data={softwareApplicationLd(product, pageUrl)} />

      <header className="flex flex-col gap-5 rounded-lg border border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-brand text-2xl font-semibold tracking-tight sm:text-3xl">{product.name}</h1>
              {product.pricing && <PricingBadge pricing={product.pricing} />}
              {product.featured && (
                <Badge variant="outline" className="font-normal text-muted-foreground">
                  精选
                </Badge>
              )}
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{product.description}</p>
          </div>

          <Button
            size="lg"
            render={
              <a href={product.url} target="_blank" rel="noopener noreferrer" {...productHistoryAttrs(product)} />
            }
          >
            <ExternalLink />
            直达官网
          </Button>
        </div>

        <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 font-data text-xs text-muted-foreground">
          {category && (
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">分类</dt>
              <dd>
                <Link
                  href={categoryHref(category.id)}
                  className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                >
                  {categoryIconNode(category.icon, "size-3")}
                  {category.name}
                </Link>
              </dd>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <dt>官网</dt>
            <dd className="text-muted-foreground/70">{domain}</dd>
          </div>
          {date && (
            <div className="flex items-center gap-1.5">
              <dt>收录</dt>
              <dd className="text-muted-foreground/70">{formatDate(date)}</dd>
            </div>
          )}
        </dl>
      </header>

      {tags.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">标签</h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="text-sm font-semibold">相关工具</h2>
          <div className="rounded-lg border border-border bg-card">
            {related.map((item, index) => {
              const itemCategory = categories.find((c) => c.id === item.categories[0])
              return (
                <ProductRow
                  key={item.id}
                  product={item}
                  last={index === related.length - 1}
                  categoryLabel={itemCategory?.name}
                  categoryIcon={itemCategory?.icon}
                />
              )
            })}
          </div>
        </section>
      )}

      {category && (
        <p>
          <Link
            href={categoryHref(category.id)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            返回「{category.name}」
          </Link>
        </p>
      )}
    </div>
  )
}
