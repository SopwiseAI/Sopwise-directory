import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  addToHistory,
  removeFromHistory,
  clearHistory,
  getHistory,
  getHistoryItem,
  getHistorySnapshot,
  groupHistoryByPeriod,
  parseHistorySnapshot,
  subscribeHistory,
  type HistoryItem
} from "./history"
import type { Product } from "./types"

const mockProduct: Product = {
  id: "test-1",
  name: "Test Product",
  description: "A test product",
  url: "https://test.com",
  categoryId: "test-cat",
  pricing: "free",
  featured: false,
  createdAt: "2024-01-01"
}

describe("addToHistory", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("adds a new product to the front", () => {
    addToHistory(mockProduct)
    const list = getHistory()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe("test-1")
    expect(list[0].name).toBe("Test Product")
    expect(list[0].domain).toBe("test.com")
  })

  it("deduplicates by moving existing product to front", () => {
    addToHistory(mockProduct)
    addToHistory({ ...mockProduct, id: "test-2", name: "Second" })
    addToHistory(mockProduct)
    const list = getHistory()
    expect(list).toHaveLength(2)
    expect(list[0].id).toBe("test-1")
    expect(list[1].id).toBe("test-2")
  })

  it("trims to 500 items max", () => {
    for (let i = 0; i < 505; i++) {
      addToHistory({ ...mockProduct, id: `p-${i}`, name: `Product ${i}` })
    }
    const list = getHistory()
    expect(list).toHaveLength(500)
    expect(list[0].id).toBe("p-504")
    expect(list[499].id).toBe("p-5")
  })
})

describe("再次访问", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("首次访问 visitCount=1，first=last", () => {
    addToHistory(mockProduct)
    const item = getHistory()[0]
    expect(item.visitCount).toBe(1)
    expect(item.firstVisitedAt).toBe(item.lastVisitedAt)
  })

  it("再次访问：计数+1、置顶、保留 firstVisitedAt", async () => {
    addToHistory(mockProduct)
    const first = getHistory()[0].firstVisitedAt
    await new Promise((r) => setTimeout(r, 5))
    addToHistory({ ...mockProduct, id: "test-2" })
    addToHistory(mockProduct)
    const list = getHistory()
    expect(list[0].id).toBe("test-1")
    expect(list[0].visitCount).toBe(2)
    expect(list[0].firstVisitedAt).toBe(first)
    expect(new Date(list[0].lastVisitedAt).getTime()).toBeGreaterThanOrEqual(new Date(list[1].lastVisitedAt).getTime())
  })

  it("超出 500 裁剪最旧，持续回访的条目始终保留", () => {
    addToHistory(mockProduct)
    for (let i = 0; i < 600; i++) {
      addToHistory({ ...mockProduct, id: `p-${i}`, name: `P${i}` })
      addToHistory(mockProduct) // 每次新访问后回访 test-1
    }
    const list = getHistory()
    expect(list).toHaveLength(500)
    expect(list[0].id).toBe("test-1")
    expect(list[0].visitCount).toBe(601)
  })
})

describe("数据模型与迁移", () => {
  beforeEach(() => localStorage.clear())

  it("旧版裸数组迁移：visitedAt → lastVisitedAt，补 firstVisitedAt/visitCount", () => {
    localStorage.setItem(
      "xigee:history",
      JSON.stringify([
        {
          id: "a",
          name: "A",
          url: "https://a.com",
          domain: "a.com",
          categoryId: "c",
          visitedAt: "2024-01-01T00:00:00.000Z"
        }
      ])
    )
    const list = getHistory()
    expect(list).toHaveLength(1)
    expect(list[0].lastVisitedAt).toBe("2024-01-01T00:00:00.000Z")
    expect(list[0].firstVisitedAt).toBe("2024-01-01T00:00:00.000Z")
    expect(list[0].visitCount).toBe(1)
    expect((list[0] as unknown as Record<string, unknown>).visitedAt).toBeUndefined()
  })

  it("丢弃缺失 id/url 的脏数据，非法日期兜底", () => {
    localStorage.setItem(
      "xigee:history",
      JSON.stringify([
        { id: "", url: "https://x.com", name: "bad" },
        { id: "ok", url: "https://ok.com", name: "OK", lastVisitedAt: "not-a-date" }
      ])
    )
    const list = getHistory()
    expect(list.map((i) => i.id)).toEqual(["ok"])
    expect(Number.isNaN(Date.parse(list[0].lastVisitedAt))).toBe(false)
  })

  it("非法 JSON 返回空数组", () => {
    localStorage.setItem("xigee:history", "{not json")
    expect(getHistory()).toEqual([])
  })
})

describe("remove/clear/getHistoryItem", () => {
  beforeEach(() => localStorage.clear())

  it("removeFromHistory 删除指定项", () => {
    addToHistory({ ...mockProduct, id: "a" })
    addToHistory({ ...mockProduct, id: "b" })
    removeFromHistory("a")
    expect(getHistory().map((i) => i.id)).toEqual(["b"])
  })

  it("删除不存在的 id 不派发事件", () => {
    const cb = vi.fn()
    const unsub = subscribeHistory(cb)
    removeFromHistory("nope")
    expect(cb).not.toHaveBeenCalled()
    unsub()
  })

  it("getHistoryItem 按 id 取单条", () => {
    addToHistory({ ...mockProduct, id: "a" })
    expect(getHistoryItem("a")?.id).toBe("a")
    expect(getHistoryItem("x")).toBeUndefined()
  })

  it("clearHistory 清空", () => {
    addToHistory(mockProduct)
    clearHistory()
    expect(getHistory()).toEqual([])
  })
})

describe("subscribeHistory", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("calls callback on history change", () => {
    const cb = vi.fn()
    const unsub = subscribeHistory(cb)
    addToHistory(mockProduct)
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
  })

  it("unsubscribe stops callbacks", () => {
    const cb = vi.fn()
    const unsub = subscribeHistory(cb)
    unsub()
    addToHistory(mockProduct)
    expect(cb).not.toHaveBeenCalled()
  })
})

describe("配额降级", () => {
  beforeEach(() => localStorage.clear())

  it("setItem 抛 QuotaExceededError 时递减重试且不破坏数据", () => {
    addToHistory(mockProduct)
    const original = Storage.prototype.setItem
    let calls = 0
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
      this: Storage,
      k: string,
      v: string
    ) {
      if (k === "xigee:history" && calls++ === 0) throw new DOMException("quota", "QuotaExceededError")
      return original.call(this, k, v)
    })
    addToHistory({ ...mockProduct, id: "test-2" })
    spy.mockRestore()
    expect(getHistory().map((i) => i.id)).toContain("test-2")
  })
})

describe("groupHistoryByPeriod", () => {
  const mk = (id: string, iso: string): HistoryItem => ({
    id,
    name: id,
    url: `https://${id}.com`,
    domain: `${id}.com`,
    categoryId: "",
    lastVisitedAt: iso,
    firstVisitedAt: iso,
    visitCount: 1
  })

  it("按 今天/昨天/本周/更早 分组", () => {
    const now = new Date("2026-03-10T12:00:00")
    const groups = groupHistoryByPeriod(
      [
        mk("today", "2026-03-10T09:00:00"),
        mk("yesterday", "2026-03-09T22:00:00"),
        mk("week", "2026-03-06T10:00:00"),
        mk("old", "2026-01-01T10:00:00")
      ],
      now
    )
    expect(groups.map((g) => g.label)).toEqual(["今天", "昨天", "近 7 天", "更早"])
    expect(groups[0].items.map((i) => i.id)).toEqual(["today"])
    expect(groups[3].items.map((i) => i.id)).toEqual(["old"])
  })

  it("空分组不输出", () => {
    const now = new Date("2026-03-10T12:00:00")
    expect(groupHistoryByPeriod([mk("old", "2026-01-01T10:00:00")], now).map((g) => g.label)).toEqual(["更早"])
  })
})

describe("parseHistorySnapshot", () => {
  beforeEach(() => localStorage.clear())

  it("解析版本化信封", () => {
    addToHistory(mockProduct)
    const raw = getHistorySnapshot()
    expect(raw).toContain('"v":2')
    expect(parseHistorySnapshot(raw).map((i) => i.id)).toEqual(["test-1"])
  })

  it("解析旧版裸数组并迁移", () => {
    const raw = JSON.stringify([
      { id: "a", name: "A", url: "https://a.com", categoryId: "c", visitedAt: "2024-01-01T00:00:00.000Z" }
    ])
    const list = parseHistorySnapshot(raw)
    expect(list).toHaveLength(1)
    expect(list[0].lastVisitedAt).toBe("2024-01-01T00:00:00.000Z")
    expect(list[0].visitCount).toBe(1)
  })

  it("非法 JSON 返回空数组", () => {
    expect(parseHistorySnapshot("{bad")).toEqual([])
  })
})
