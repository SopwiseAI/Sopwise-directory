export const PRICINGS = ["free", "freemium", "paid", "opensource"] as const

export type Pricing = (typeof PRICINGS)[number]

/**
 * 主题（后端 `xg_topic` / 导出 `topics.json` 的元素）。
 * `icon` 是 emoji 字符；`toolCount` 是导出端聚合的派生字段（前端另有自算口径，见 `lib/data.ts`）。
 */
export interface Topic {
  id: string
  name: string
  icon: string
  description?: string
  toolCount?: number
}

/** 工具（后端 `xg_tool` / 导出 `tools.json` 的元素）。 */
export interface Tool {
  id: string
  name: string
  description: string
  url: string
  topics: string[]
  tags?: string[]
  pricing?: Pricing
  featured?: boolean
  publishedAt?: string
  createdAt?: string
}

export interface SiteData {
  topics: Topic[]
  tools: Tool[]
}
