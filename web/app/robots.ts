import type { MetadataRoute } from "next"
import { getBaseUrl } from "@/lib/utils"

/**
 * robots.txt 不屏蔽任何路径：/search /history /settings 的收录控制统一交给页面内的
 * `robots: noindex` 元标签。若在此 disallow，爬虫抓不到页面也就读不到 noindex，
 * URL 仍可能以无摘要形式留在索引里 —— 两道防线互相拆台，反而不如单用 noindex。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${getBaseUrl()}/sitemap.xml`
  }
}
