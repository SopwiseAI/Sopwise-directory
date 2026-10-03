import { describe, it, expect, afterEach, vi } from "vitest"
import { buildSearchDocs, createSearchIndex, highlightSegments, resolveThreshold } from "./search"
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
    createdAt: "2022-11-30"
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
    createdAt: "2022-07-01"
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
    createdAt: "2021-06-29"
  }
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
      "code-tools": "代码工具"
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
      { text: "GPT", match: false }
    ])
  })

  it("命中段落中间", () => {
    expect(highlightSegments("AI 图像生成工具", "图像")).toEqual([
      { text: "AI ", match: false },
      { text: "图像", match: true },
      { text: "生成工具", match: false }
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
