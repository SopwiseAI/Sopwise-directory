import { describe, it, expect } from "vitest"
import { compareDateDesc, compareRecommended, getToolDate, latestToolDate, toolHistoryAttrs } from "./tool"
import type { Tool } from "./types"

const mockTool: Tool = {
  id: "test-1",
  name: "Test Tool",
  description: "A test tool",
  url: "https://test.com",
  topics: ["test-cat"],
  tags: ["test"],
  pricing: "free",
  featured: false,
  createdAt: "2024-01-01",
}

describe("getToolDate", () => {
  it("returns publishedAt when available", () => {
    const p = { ...mockTool, publishedAt: "2024-06-01" }
    expect(getToolDate(p)).toBe("2024-06-01")
  })

  it("falls back to createdAt", () => {
    expect(getToolDate(mockTool)).toBe("2024-01-01")
  })

  it("returns empty string when neither exists", () => {
    const p = { ...mockTool, createdAt: undefined }
    expect(getToolDate(p)).toBe("")
  })
})

describe("toolHistoryAttrs", () => {
  it("generates correct data attributes", () => {
    const attrs = toolHistoryAttrs(mockTool)
    expect(attrs["data-history-id"]).toBe("test-1")
    expect(attrs["data-history-name"]).toBe("Test Tool")
    expect(attrs["data-history-url"]).toBe("https://test.com")
    expect(attrs["data-history-topic"]).toBe("test-cat")
    expect(attrs["data-history-pricing"]).toBe("free")
  })

  it("handles missing pricing", () => {
    const p = { ...mockTool, pricing: undefined }
    const attrs = toolHistoryAttrs(p)
    expect(attrs["data-history-pricing"]).toBe("")
  })
})

describe("compareRecommended", () => {
  const mk = (id: string, date: string, featured = false): Tool => ({
    ...mockTool,
    id,
    name: id,
    createdAt: date,
    featured,
  })

  it("精选优先于非精选", () => {
    const list = [mk("a", "2024-01-01", false), mk("b", "2020-01-01", true)]
    list.sort(compareRecommended)
    expect(list.map((p) => p.id)).toEqual(["b", "a"])
  })

  it("同为精选时按日期倒序", () => {
    const list = [mk("old", "2020-01-01", true), mk("new", "2024-01-01", true)]
    list.sort(compareRecommended)
    expect(list.map((p) => p.id)).toEqual(["new", "old"])
  })

  it("同精同日时按名称升序（确定性）", () => {
    const list = [mk("beta", "2024-01-01"), mk("alpha", "2024-01-01")]
    list.sort(compareRecommended)
    expect(list.map((p) => p.id)).toEqual(["alpha", "beta"])
  })

  it("排序稳定：不修改入参顺序", () => {
    const a = mk("a", "2024-01-01")
    const b = mk("b", "2024-01-01")
    const list = [b, a]
    list.sort(compareRecommended)
    expect(list[0].id).toBe("a")
  })

  it("中英混排名称排序确定性（回归：localeCompare 导致 hydration mismatch）", () => {
    const en = mk("poe", "2024-01-01")
    const zh = mk("沉浸式翻译", "2024-01-01")
    const list1 = [en, zh]
    const list2 = [zh, en]
    list1.sort(compareRecommended)
    list2.sort(compareRecommended)
    expect(list1.map((p) => p.id)).toEqual(list2.map((p) => p.id))
  })
})

describe("compareDateDesc（确定性日期排序）", () => {
  const mk = (id: string, date: string): Tool => ({ ...mockTool, id, name: id, createdAt: date })

  it("纯日期按时间倒序", () => {
    const list = [mk("old", "2020-01-01"), mk("new", "2024-06-01"), mk("mid", "2022-03-03")]
    list.sort((a, b) => compareDateDesc(getToolDate(a), getToolDate(b)))
    expect(list.map((p) => p.id)).toEqual(["new", "mid", "old"])
  })

  it("日期部分相同但带时间的串，与纯日期判定为同一时刻（不因格式反转）", () => {
    const dateOnly = mk("d", "2024-01-15")
    const withTime = mk("t", "2024-01-15T10:00:00Z")
    const list = [withTime, dateOnly]
    list.sort((a, b) => compareDateDesc(getToolDate(a), getToolDate(b)))
    // 两者日期部分相同 → 视为相等（返回 0），不应把带时间的排在纯日期之前
    expect(compareDateDesc(getToolDate(withTime), getToolDate(dateOnly))).toBe(0)
  })

  it("空日期排在最后", () => {
    const empty = { ...mockTool, id: "e", name: "e", createdAt: undefined }
    const dated = mk("d", "2024-01-01")
    expect(compareDateDesc(getToolDate(empty), getToolDate(dated))).toBeGreaterThan(0)
  })
})

describe("latestToolDate", () => {
  const mk = (id: string, date?: string): Tool => ({ ...mockTool, id, name: id, createdAt: date })

  it("返回最新日期", () => {
    const list = [mk("a", "2020-01-01"), mk("b", "2024-06-01"), mk("c", "2022-03-03")]
    expect(latestToolDate(list)).toBe("2024-06-01")
  })

  it("混入带时间的 ISO 串时按日期部分取最新（不因格式反转）", () => {
    const list = [mk("a", "2024-01-15"), mk("b", "2024-01-16T09:00:00Z")]
    expect(latestToolDate(list)).toBe("2024-01-16T09:00:00Z")
  })

  it("全部无日期时返回 null", () => {
    expect(latestToolDate([mk("a"), mk("b")])).toBeNull()
  })

  it("空数组返回 null", () => {
    expect(latestToolDate([])).toBeNull()
  })
})
