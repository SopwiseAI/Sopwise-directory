import { describe, it, expect, afterEach, vi } from "vitest"
import {
  buildSearchDocs,
  buildSuggestionDocs,
  createSearchIndex,
  createSuggestionIndex,
  getSuggestionIndex,
  highlightSegments,
  resolveThreshold,
  suggest,
  snippet,
  matchedTags,
  createFallbackIndex,
  findRelated,
  SUGGEST_LIMIT,
} from "./search"
import type { Product } from "./types"

const mockProducts: Product[] = [
  {
    id: "1",
    name: "ChatGPT",
    description: "AI 对话助手",
    url: "https://chat.openai.com",
    categories: ["chat-assistant"],
    tags: ["AI", "对话"],
    pricing: "freemium",
    featured: true,
    createdAt: "2022-11-30",
  },
  {
    id: "2",
    name: "Midjourney",
    description: "AI 图像生成",
    url: "https://midjourney.com",
    categories: ["image-generation"],
    tags: ["AI", "图像"],
    pricing: "paid",
    featured: false,
    createdAt: "2022-07-01",
  },
  {
    id: "3",
    name: "GitHub Copilot",
    description: "AI 代码助手",
    url: "https://github.com/copilot",
    categories: ["code-tools"],
    tags: ["AI", "代码"],
    pricing: "paid",
    featured: true,
    createdAt: "2021-06-29",
  },
]

describe("createSearchIndex", () => {
  const index = createSearchIndex(mockProducts)

  it("finds products by name", () => {
    const results = index.search("ChatGPT")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.name).toBe("ChatGPT")
  })

  it("finds products by description", () => {
    const results = index.search("图像生成")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe("2")
  })

  it("finds products by tag", () => {
    const results = index.search("代码")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe("3")
  })

  it("returns empty for no match", () => {
    const results = index.search("zzznomatch")
    expect(results.length).toBe(0)
  })

  it("finds products by category name", () => {
    const idx = createSearchIndex(mockProducts, {
      "chat-assistant": "对话助手",
      "image-generation": "图像生成",
      "code-tools": "代码工具",
    })
    const results = idx.search("对话助手")
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].item.id).toBe("1")
    expect(results[0].item.categoryNames).toContain("对话助手")
  })

  it("buildSearchDocs 展开分类名并过滤未知分类", () => {
    const docs = buildSearchDocs(mockProducts, { "chat-assistant": "对话助手" })
    expect(docs[0].categoryNames).toEqual(["对话助手"])
    expect(docs[1].categoryNames).toEqual([])
    expect(docs[0].name).toBe("ChatGPT")
  })
})

describe("highlightSegments", () => {
  it("无查询词返回整段未命中", () => {
    expect(highlightSegments("ChatGPT", "")).toEqual([{ text: "ChatGPT", match: false }])
    expect(highlightSegments("ChatGPT", "   ")).toEqual([{ text: "ChatGPT", match: false }])
  })

  it("大小写不敏感命中并分段", () => {
    expect(highlightSegments("ChatGPT", "chat")).toEqual([
      { text: "Chat", match: true },
      { text: "GPT", match: false },
    ])
  })

  it("命中段落中间", () => {
    expect(highlightSegments("AI 图像生成工具", "图像")).toEqual([
      { text: "AI ", match: false },
      { text: "图像", match: true },
      { text: "生成工具", match: false },
    ])
  })

  it("多点命中全部标记", () => {
    const segs = highlightSegments("aXaXa", "a")
    expect(segs.filter((s) => s.match).map((s) => s.text)).toEqual(["a", "a", "a"])
  })

  it("多词查询合并区间", () => {
    const segs = highlightSegments("hello world", "hello world")
    expect(segs.filter((s) => s.match).length).toBeGreaterThanOrEqual(2)
    expect(segs.some((s) => s.text === " " && !s.match)).toBe(true)
  })

  it("无命中返回整段", () => {
    expect(highlightSegments("ChatGPT", "zzz")).toEqual([{ text: "ChatGPT", match: false }])
  })

  it("空文本安全", () => {
    expect(highlightSegments("", "a")).toEqual([{ text: "", match: false }])
  })
})

describe("resolveThreshold", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("returns default 0.3 when env unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "")
    expect(resolveThreshold()).toBe(0.3)
  })

  it("respects 0 (regression: || would coerce to 0.3)", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "0")
    expect(resolveThreshold()).toBe(0)
  })

  it("parses custom value", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "0.5")
    expect(resolveThreshold()).toBe(0.5)
  })

  it("falls back to default for non-numeric", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "abc")
    expect(resolveThreshold()).toBe(0.3)
  })

  it("treats whitespace-only as unset", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", " ")
    expect(resolveThreshold()).toBe(0.3)
  })

  it("clamps out-of-range values into [0,1]", () => {
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "5")
    expect(resolveThreshold()).toBe(1)
    vi.stubEnv("NEXT_PUBLIC_SEARCH_THRESHOLD", "-1")
    expect(resolveThreshold()).toBe(0)
  })
})

describe("buildSuggestionDocs", () => {
  const docs = buildSuggestionDocs(mockProducts, {
    "chat-assistant": "对话助手",
    "image-generation": "图像生成",
    "code-tools": "代码工具",
  })

  it("保留 id / name / url / categories / pricing 供建议与历史埋点共用", () => {
    expect(docs[0]).toMatchObject({
      id: "1",
      name: "ChatGPT",
      url: "https://chat.openai.com",
      categories: ["chat-assistant"],
      pricing: "freemium",
    })
    expect(docs[0].categoryNames).toEqual(["对话助手"])
  })

  it("不含 description：建议只展示名称/分类/域名，描述占了产品数据四成体积", () => {
    expect(Object.keys(docs[0])).not.toContain("description")
  })

  it("展开分类名并过滤未知分类 id", () => {
    const mixed = buildSuggestionDocs(mockProducts, { "chat-assistant": "对话助手" })
    expect(mixed[0].categoryNames).toEqual(["对话助手"])
    expect(mixed[1].categoryNames).toEqual([])
  })
})

describe("suggest", () => {
  const docs = buildSuggestionDocs(mockProducts, {
    "chat-assistant": "对话助手",
    "image-generation": "图像生成",
    "code-tools": "代码工具",
  })
  const index = createSuggestionIndex(docs)

  it("按名称命中并把最匹配的排在最前", () => {
    expect(suggest(index, "chat")[0]?.name).toBe("ChatGPT")
    expect(suggest(index, "midjourney")[0]?.name).toBe("Midjourney")
  })

  it("按分类名命中（用户敲的是分类词不是产品名）", () => {
    expect(suggest(index, "图像生成").map((d) => d.name)).toContain("Midjourney")
  })

  it("空/纯空白查询直接返回空，避免下拉空闪一下", () => {
    expect(suggest(index, "")).toEqual([])
    expect(suggest(index, "   ")).toEqual([])
  })

  it("无命中返回空", () => {
    expect(suggest(index, "zzzqqqxx")).toEqual([])
  })

  it("最多返回 SUGGEST_LIMIT 条，下拉不会盖住整块内容", () => {
    const many = Array.from({ length: SUGGEST_LIMIT + 4 }, (_, i) => ({
      id: `p${i}`,
      name: `Tool ${i}`,
      url: `https://tool${i}.example.com`,
      categories: ["c"],
      categoryNames: ["工具"],
      tags: ["tool"],
    }))
    expect(suggest(createSuggestionIndex(many), "tool")).toHaveLength(SUGGEST_LIMIT)
  })
})

describe("getSuggestionIndex", () => {
  const docs = buildSuggestionDocs(mockProducts, { "chat-assistant": "对话助手" })

  it("同一数据数组命中缓存，索引只建一次", () => {
    expect(getSuggestionIndex(docs)).toBe(getSuggestionIndex(docs))
  })

  it("不同数据数组各自建索引（不串数据）", () => {
    const other = buildSuggestionDocs([...mockProducts].slice(0, 1), { "chat-assistant": "对话助手" })
    expect(getSuggestionIndex(docs)).not.toBe(getSuggestionIndex(other))
  })
})

describe("snippet", () => {
  const long = "OpenAI 推出的对话式 AI 助手，支持文本生成、代码编写与多轮对话。"

  it("把命中词包进上下文，并在被截断的一侧补省略号", () => {
    const out = snippet(long, "代码")
    expect(out).toContain("代码")
    expect(out.startsWith("…")).toBe(true)
    // 命中点已经很靠后，右侧就是原文结尾，不该多补一个省略号
    expect(out.endsWith("…")).toBe(false)
  })

  it("短文本原样返回（不为了省略号而省略）", () => {
    expect(snippet("短描述", "短")).toBe("短描述")
    expect(snippet("短描述", "无关")).toBe("短描述")
  })

  it("没有命中时退化为从头截断", () => {
    expect(snippet("a".repeat(100), "zzz")).toBe(`${"a".repeat(36)}…`)
  })

  it("空文本安全", () => {
    expect(snippet("", "x")).toBe("")
  })
})

describe("matchedTags", () => {
  it("只返回真正命中查询词的标签", () => {
    expect(matchedTags(["对话", "文本生成", "OpenAI"], "文本")).toEqual(["文本生成"])
  })

  it("大小写不敏感", () => {
    expect(matchedTags(["OpenAI", "对话"], "openai")).toEqual(["OpenAI"])
  })

  it("多词查询任一命中即可", () => {
    expect(matchedTags(["对话", "绘画"], "绘画 视频")).toEqual(["绘画"])
  })

  it("最多返回 limit 个", () => {
    expect(matchedTags(["a1", "a2", "a3"], "a", 2)).toHaveLength(2)
  })

  it("无标签 / 空查询返回空", () => {
    expect(matchedTags(undefined, "a")).toEqual([])
    expect(matchedTags([], "a")).toEqual([])
    expect(matchedTags(["对话"], "   ")).toEqual([])
  })
})

describe("createFallbackIndex / findRelated", () => {
  const names = { "chat-assistant": "对话助手", "image-generation": "图像生成", "code-tools": "代码工具" }
  const strict = createSearchIndex(mockProducts, names)
  const loose = createFallbackIndex(mockProducts, names)

  it("宽松索引比常规索引捞得更多", () => {
    expect(strict.search("对话助手x").length).toBeLessThan(loose.search("对话助手x").length)
  })

  it("无关查询不硬凑结果（分数上限挡住噪音）", () => {
    expect(findRelated(loose, "zzzznotfound")).toEqual([])
  })

  it("空查询返回空", () => {
    expect(findRelated(loose, "   ")).toEqual([])
  })

  it("遵守条数上限", () => {
    expect(findRelated(loose, "AI", 2).length).toBeLessThanOrEqual(2)
  })
})
