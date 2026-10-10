import type { MetadataRoute } from "next"
import { getAllCategories, getAllProducts, getCategoryCounts, getProductsByCategory } from "@/lib/data"
import { latestProductDate } from "@/lib/product"
import type { Product } from "@/lib/types"
import { getBaseUrl } from "@/lib/utils"

/** 附带该组产品中最新的发布日期；无日期时省略 lastModified（不写 epoch 回落值，避免误导爬虫）。 */
function withLastModified(url: string, products: readonly Product[]): MetadataRoute.Sitemap[number] {
  const latest = latestProductDate(products)
  return latest ? { url, lastModified: new Date(latest) } : { url }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const categories = getAllCategories()
  const countMap = getCategoryCounts()

  const categoryUrls = categories
    .filter((cat) => (countMap[cat.id] ?? 0) > 0)
    .map((cat) => withLastModified(`${baseUrl}/category/${cat.id}`, getProductsByCategory(cat.id)))

  const infoUrls = ["/about", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl}${path}`
  }))

  return [withLastModified(baseUrl, getAllProducts()), ...categoryUrls, ...infoUrls]
}
