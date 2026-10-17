import type { MetadataRoute } from "next"
import { getAllTopics, getAllTools, getTopicCounts, getToolsByTopic } from "@/lib/data"
import { latestToolDate } from "@/lib/tool"
import type { Tool } from "@/lib/types"
import { getBaseUrl } from "@/lib/utils"

/** 附带该组工具中最新的发布日期；无日期时省略 lastModified（不写 epoch 回落值，避免误导爬虫）。 */
function withLastModified(url: string, tools: readonly Tool[]): MetadataRoute.Sitemap[number] {
  const latest = latestToolDate(tools)
  return latest ? { url, lastModified: new Date(latest) } : { url }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  const topics = getAllTopics()
  const countMap = getTopicCounts()

  const topicUrls = topics
    .filter((cat) => (countMap[cat.id] ?? 0) > 0)
    .map((cat) => withLastModified(`${baseUrl}/topic/${cat.id}`, getToolsByTopic(cat.id)))

  const infoUrls = ["/about", "/privacy", "/terms"].map((path) => ({
    url: `${baseUrl}${path}`,
  }))

  return [withLastModified(baseUrl, getAllTools()), ...topicUrls, ...infoUrls]
}
