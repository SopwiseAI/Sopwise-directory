import { describe, it, expect } from "vitest"
import {
  getAllTopics,
  getAllTools,
  getTopicById,
  getTopicCounts,
  getFeaturedTools,
  getToolsByTopic,
  getStats,
} from "./data"

const topics = getAllTopics()
const tools = getAllTools()

describe("数据完整性不变式", () => {
  it("topics 与 tools 均非空", () => {
    expect(topics.length).toBeGreaterThan(0)
    expect(tools.length).toBeGreaterThan(0)
  })

  it("topic id 唯一", () => {
    const ids = topics.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("tool id 唯一", () => {
    const ids = tools.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("所有 tool.topics 都引用了已存在的 topic", () => {
    const topicIds = new Set(topics.map((t) => t.id))
    for (const tool of tools) {
      for (const topicId of tool.topics) {
        expect(topicIds.has(topicId)).toBe(true)
      }
    }
  })

  it("所有 tool.description 非空", () => {
    // 守住 tagline → description 的字段切换点：真实导出用 `tagline`，一旦导出产物落地而
    // lib/data.ts 还没跟着改，描述会静默变空串（卡片留空白行、搜索描述权重失效）。
    for (const tool of tools) {
      expect(tool.description, `工具 ${tool.id} 的描述为空`).not.toBe("")
    }
  })

  it("所有 topic.icon 都是 emoji", () => {
    for (const topic of topics) {
      expect(topic.icon, `主题 ${topic.id} 的图标不是 emoji`).toMatch(/\p{Extended_Pictographic}/u)
    }
  })

  it("topic.toolCount（导出派生字段）与 tools[] 实际归属数一致", () => {
    const derived = getTopicCounts()
    for (const topic of topics) {
      expect(topic.toolCount, `主题 ${topic.id} 的 toolCount 与 tools[] 不一致`).toBe(derived[topic.id] ?? 0)
    }
  })
})

describe("getTopicById", () => {
  it("returns topic for valid id", () => {
    const first = getAllTopics()[0]
    expect(getTopicById(first.id)?.id).toBe(first.id)
  })

  it("returns undefined for unknown id", () => {
    expect(getTopicById("definitely-does-not-exist")).toBeUndefined()
  })
})

describe("getFeaturedTools", () => {
  it("only returns featured=true tools", () => {
    const featured = getFeaturedTools()
    expect(featured.length).toBeGreaterThan(0)
    for (const tool of featured) expect(tool.featured).toBe(true)
  })
})

describe("getToolsByTopic", () => {
  it("returns tools matching topicId", () => {
    const topic = getAllTopics()[0]
    const list = getToolsByTopic(topic.id)
    for (const tool of list) expect(tool.topics).toContain(topic.id)
  })

  it("returns empty for unknown topicId", () => {
    expect(getToolsByTopic("no-such-topic")).toEqual([])
  })
})

describe("getTopicCounts", () => {
  it("各主题计数之和等于全部工具的主题引用数之和", () => {
    const counts = getTopicCounts()
    const total = tools.reduce((n, tool) => n + tool.topics.length, 0)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(total)
  })

  it("被任一工具引用的主题计数至少为 1", () => {
    const counts = getTopicCounts()
    for (const tool of tools) {
      for (const topicId of tool.topics) expect(counts[topicId]).toBeGreaterThanOrEqual(1)
    }
  })
})

describe("getStats", () => {
  it("与源数据一致", () => {
    const stats = getStats()
    expect(stats.tools).toBe(tools.length)
    expect(stats.topics).toBe(topics.length)
    expect(stats.featured).toBe(tools.filter((t) => t.featured).length)
  })
})
