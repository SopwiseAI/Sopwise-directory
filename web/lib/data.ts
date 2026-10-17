import "server-only"
import topicsData from "@/data/topics.json"
import toolsData from "@/data/tools.json"
import { PRICINGS, type Topic, type Tool, type SiteData } from "./types"

const PRICING_SET: ReadonlySet<string> = new Set(PRICINGS)

function assertString(val: unknown, field: string): string {
  if (typeof val !== "string" || !val.trim()) {
    throw new Error(`[data] 字段 ${field} 必须为非空字符串，实际值: ${JSON.stringify(val)}`)
  }
  return val
}

function assertTopic(raw: unknown): Topic {
  if (!raw || typeof raw !== "object") throw new Error("[data] 无效的主题条目")
  const r = raw as Record<string, unknown>
  return {
    id: assertString(r.id, "topic.id"),
    name: assertString(r.name, "topic.name"),
    // 主题图标是 emoji 字符（见 lib/topic-icon-node.tsx）
    icon: assertString(r.icon, "topic.icon"),
    description: typeof r.description === "string" ? r.description : undefined,
    // 派生字段：脏导出里的负数 / 小数 / NaN 一律当作「没给」，避免把非法值带进一致性校验
    toolCount: Number.isInteger(r.toolCount) && (r.toolCount as number) >= 0 ? (r.toolCount as number) : undefined,
  }
}

/**
 * 工具描述文案。
 *
 * 导出契约里的字段名是 `tagline`，而当前的过渡数据用的是 `description`。两份都没有时回落空串。
 * 因此「有 `tagline` 却没有 `description`」恰好是**真实 prod 导出已落地、但解析字段还没跟着切**
 * 的信号 —— 那种情况下描述会静默变成空串（卡片留空白行、搜索描述权重失效），所以这里显式告警。
 * 注意这里只告警不做别名回落：字段切换是内容搬迁时的一次性决策，不该由解析层长期兼容。
 */
function resolveDescription(r: Record<string, unknown>, id: string): string {
  if (typeof r.description === "string") return r.description
  if (typeof r.tagline === "string" && r.tagline.trim() && process.env.NODE_ENV !== "production") {
    console.warn(`[data] 工具 "${id}" 只有 tagline 没有 description：导出格式已切换，请把解析字段改成 tagline`)
  }
  return ""
}

function assertTool(raw: unknown): Tool {
  if (!raw || typeof raw !== "object") throw new Error("[data] 无效的工具条目")
  const r = raw as Record<string, unknown>
  const id = assertString(r.id, "tool.id")
  const pricing = r.pricing
  if (pricing !== undefined) {
    if (typeof pricing !== "string" || !PRICING_SET.has(pricing)) {
      throw new Error(`[data] 工具 "${id}" 的 pricing 非法: ${JSON.stringify(pricing)}`)
    }
  }
  const tags = Array.isArray(r.tags)
    ? [...new Set(r.tags.filter((t): t is string => typeof t === "string"))]
    : undefined
  const topics = Array.isArray(r.topics) ? [...new Set(r.topics.filter((t): t is string => typeof t === "string"))] : []

  return {
    id,
    name: assertString(r.name, `tool[${id}].name`),
    description: resolveDescription(r, id),
    url: assertString(r.url, `tool[${id}].url`),
    topics,
    tags: tags && tags.length > 0 ? tags : undefined,
    pricing: pricing as Tool["pricing"],
    featured: typeof r.featured === "boolean" ? r.featured : undefined,
    publishedAt: typeof r.publishedAt === "string" ? r.publishedAt : undefined,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
  }
}

/**
 * 校验并归一化两份数据文件（`topics.json` + `tools.json`，格式对齐 studio 导出产物）。
 *
 * 数据源已从旧的单文件 `data.json` 拆成两份：主题一份、工具一份，键名与导出格式一致
 * （主题用 `topics[].id`，工具归属用 `tools[].topics`）。
 */
function assertSiteData(rawTopics: unknown, rawTools: unknown): SiteData {
  if (!Array.isArray(rawTopics)) throw new Error("[data] topics.json 根节点必须为数组")
  if (!Array.isArray(rawTools)) throw new Error("[data] tools.json 根节点必须为数组")
  const topics = rawTopics.map(assertTopic)
  const tools = rawTools.map(assertTool)
  const topicIds = new Set(topics.map((t) => t.id))
  if (topicIds.size !== topics.length) throw new Error("[data] 存在重复的 topic id")
  const toolIds = new Set<string>()
  const urlKeys = new Map<string, string>()
  for (const tool of tools) {
    if (toolIds.has(tool.id)) throw new Error(`[data] 存在重复的 tool id: ${tool.id}`)
    toolIds.add(tool.id)
    const urlKey = tool.url.replace(/\/+$/, "").toLowerCase()
    const dup = urlKeys.get(urlKey)
    if (dup) {
      console.warn(`[data] 工具 "${tool.id}" 与 "${dup}" 的 URL 重复: ${tool.url}`)
    }
    urlKeys.set(urlKey, tool.id)
    for (const topicId of tool.topics) {
      if (!topicIds.has(topicId)) {
        throw new Error(`[data] 工具 "${tool.id}" 引用了不存在的 topicId "${topicId}"`)
      }
    }
  }

  // toolCount 是导出端的派生字段：口径必须与「本文件里归属于该主题的工具数」逐字一致，
  // 否则会出现「导航徽标 12 / 主题页 11」。这里只告警不抛错 —— 前端一律以 tools[] 自算为准。
  const derived: Record<string, number> = {}
  for (const tool of tools) {
    for (const topicId of tool.topics) derived[topicId] = (derived[topicId] ?? 0) + 1
  }
  for (const topic of topics) {
    if (topic.toolCount !== undefined && topic.toolCount !== (derived[topic.id] ?? 0)) {
      console.warn(
        `[data] 主题 "${topic.id}" 的 toolCount=${topic.toolCount} 与 tools[] 实际归属数=${derived[topic.id] ?? 0} 不一致`,
      )
    }
  }

  return { topics, tools }
}

const siteData = assertSiteData(topicsData, toolsData)

export function getAllTopics(): readonly Topic[] {
  return siteData.topics
}

export function getTopicById(id: string): Topic | undefined {
  return siteData.topics.find((t) => t.id === id)
}

export function getAllTools(): readonly Tool[] {
  return siteData.tools
}

export function getFeaturedTools(): readonly Tool[] {
  return siteData.tools.filter((t) => t.featured)
}

export function getToolsByTopic(topicId: string): readonly Tool[] {
  return siteData.tools.filter((t) => t.topics.includes(topicId))
}

/** topicId → 已发布工具数，供 sidebar/nav/footer 共用。 */
export function getTopicCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const tool of siteData.tools) {
    for (const topicId of tool.topics) {
      counts[topicId] = (counts[topicId] ?? 0) + 1
    }
  }
  return counts
}

export interface SiteStats {
  tools: number
  topics: number
  featured: number
}

/** 站点统计：供 settings/brand-showcase 共用。 */
export function getStats(): SiteStats {
  return {
    tools: siteData.tools.length,
    topics: siteData.topics.length,
    featured: getFeaturedTools().length,
  }
}
