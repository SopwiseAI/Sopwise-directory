import type { MetadataRoute } from "next"
import { getAllCategories, getAllProducts, getCategoryCounts, getProductsByCategory } from "@/lib/data"
import { getProductDate, latestProductDate } from "@/lib/product"
import type { Product } from "@/lib/types"
import { getBaseUrl } from "@/lib/utils"
import { categoryHref, toolHref } from "@/lib/url"

/** 附带该组产品中最新的发布日期；无日期时省略 lastModified（不写 epoch 回落值，避免误导爬虫）。 */
function withLastModified(url: string, products: readonly Product[]): MetadataRoute.Sitemap[number] {
  const latest = latestProductDate(products)
  return latest ? { url, lastModified: new Date(latest) } : { url }
}

/**
 * 站点地图。
 *
 * 只收可收录的 URL：`/search` `/history` `/settings` 都是 `noindex`，不进 sitemap；
 * 空分类（产品数为 0）会被页面自身标 `noindex`，同样排除。
 *
 * 产品详情页是这里数量最大的一批（每个产品一条）—— 它们是长尾流量的主入口，
 * 也是「无内链孤儿页」问题的另一半：sitemap 保证被发现的路径始终存在。
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const categories = getAllCategories()
  const countMap = getCategoryCounts()

  const categoryUrls = categories
    .filter((cat) => (countMap[cat.id] ?? 0) > 0)
    .map((cat) => withLastModified(`${baseUrl}${categoryHref(cat.id)}`, getProductsByCategory(cat.id)))

  const productUrls = getAllProducts().map((product) => {
    const url = `${baseUrl}${toolHref(product.id)}`
    const date = getProductDate(product)
    return date ? { url, lastModified: new Date(date) } : { url }
  })

  const infoUrls = ["/about", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl}${path}`
  }))

  return [
    withLastModified(baseUrl, getAllProducts()),
    // 分类索引页：有真实产品数的分类才让「分类」这一层站得住，所以与 categoryUrls 同门槛
    ...(categoryUrls.length > 0 ? [{ url: `${baseUrl}/category` }] : []),
    ...categoryUrls,
    ...productUrls,
    ...infoUrls
  ]
}
