import { describe, it, expect, afterEach, vi } from "vitest"
import { createSearchIndex, resolveThreshold } from "./search"
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
