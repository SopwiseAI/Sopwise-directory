import type { Metadata } from "next"
import { getAllCategories, getAllProducts } from "@/lib/data"
import { absoluteUrl, collectionPageLd } from "@/lib/seo"
import { categoryHref } from "@/lib/url"
import { ProductBrowser } from "@/components/product/product-browser"
import { Hero } from "@/components/hero/hero"
import { JsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  alternates: { canonical: "/" }
}

const products = getAllProducts()
const categories = getAllCategories()

const COLLECTION_NAME = "XiGee — 精选 AI 工具目录"
const COLLECTION_DESCRIPTION = "XiGee 精选值得用的 AI 工具，人工筛选、分类清晰，点击直达官方网站。"

/**
 * 首页是目录的根集合：`CollectionPage` + 内嵌 `ItemList`。
 *
 * `ItemList` 只列**分类**而不是 85 个产品 —— 首页要表达的是「本站有哪些分类」，
 * 产品级清单已经在各分类页与 `/tool/[slug]` 上各就各位；把 85 条塞进首页的
 * ItemList 只会和分类页的列表互相打架。
 */
export default function Home() {
  const items = categories.map((category) => ({
    name: category.name,
    url: absoluteUrl(categoryHref(category.id))
  }))

  return (
    <div className="flex flex-col gap-8">
      <JsonLd
        data={collectionPageLd({
          name: COLLECTION_NAME,
          description: COLLECTION_DESCRIPTION,
          url: absoluteUrl("/"),
          items
        })}
      />
      <Hero />
      <ProductBrowser products={products} categories={categories} />
    </div>
  )
}
