import type { MetadataRoute } from "next"
import { getAllCategories, getAllProducts } from "@/lib/data"
import { getProductDate } from "@/lib/product"
import { getBaseUrl } from "@/lib/utils"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const categories = getAllCategories()
  const products = getAllProducts()

  const lastModified = products.reduce((max, p) => {
    const date = getProductDate(p)
    return date && date > max ? date : max
  }, "1970-01-01")
  const lastModifiedDate = new Date(lastModified)

  const categoryUrls = categories.map((cat) => ({
    url: `${baseUrl}/category/${cat.id}`,
    lastModified: lastModifiedDate
  }))

  return [
    { url: baseUrl, lastModified: lastModifiedDate },
    { url: `${baseUrl}/settings`, lastModified: lastModifiedDate },
    ...categoryUrls
  ]
}
