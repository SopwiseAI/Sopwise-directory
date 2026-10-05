import type { MetadataRoute } from "next"
import { getAllCategories, getAllProducts, getCategoryCounts, getProductsByCategory } from "@/lib/data"
import { latestProductDate } from "@/lib/product"
import type { Product } from "@/lib/types"
import { getBaseUrl } from "@/lib/utils"

/** 取一组产品中最新的发布日期（无日期则回落到 epoch）。 */
function latestDate(products: readonly Product[]): string {
  return latestProductDate(products) ?? "1970-01-01"
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const categories = getAllCategories()
  const countMap = getCategoryCounts()

  const categoryUrls = categories
    .filter((cat) => (countMap[cat.id] ?? 0) > 0)
    .map((cat) => ({
      url: `${baseUrl}/category/${cat.id}`,
      lastModified: new Date(latestDate(getProductsByCategory(cat.id)))
    }))

  const infoUrls = ["/about", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl}${path}`
  }))

  return [{ url: baseUrl, lastModified: new Date(latestDate(getAllProducts())) }, ...categoryUrls, ...infoUrls]
}
