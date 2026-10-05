import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  addToHistory,
  removeFromHistory,
  clearHistory,
  filterHistory,
  getHistory,
  getHistoryCategoryIds,
  getHistoryExport,
  getHistorySnapshot,
  importHistory,
  parseHistorySnapshot,
  resolveMaxItems,
  subscribeHistory,
  type HistoryItem
} from "./history"
import type { Product } from "./types"

const mockProduct: Product = {
  id: "test-1",
  name: "Test Product",
  description: "A test product",
  url: "https://test.com",
  categories: ["test-cat"],
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

describe("remove/clear", () => {
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

describe("导出与导入", () => {
  beforeEach(() => localStorage.clear())

  it("导出为 v2 信封且可被解析", () => {
    addToHistory(mockProduct)
    const raw = getHistoryExport()
    expect(JSON.parse(raw)).toMatchObject({ v: 2 })
    expect(parseHistorySnapshot(raw).map((i) => i.id)).toEqual(["test-1"])
  })

  it("导入到空历史：计入 imported", () => {
    const file = JSON.stringify({
      v: 2,
      items: [
        { id: "a", name: "A", url: "https://a.com", visitCount: 2, lastVisitedAt: "2024-02-01T00:00:00.000Z" },
        { id: "b", name: "B", url: "https://b.com", lastVisitedAt: "2024-03-01T00:00:00.000Z" }
      ]
    })
    const res = importHistory(file)
    expect(res).toMatchObject({ imported: 2, skipped: 0, total: 2 })
    expect(getHistory().map((i) => i.id)).toEqual(["b", "a"])
  })

  it("接受旧版裸数组", () => {
    const res = importHistory(JSON.stringify([{ id: "x", name: "X", url: "https://x.com" }]))
    expect(res.imported).toBe(1)
    expect(getHistory()[0].id).toBe("x")
  })

  it("合并去重：取较大 visitCount、较新 lastVisitedAt、较早 firstVisitedAt", () => {
    addToHistory({ ...mockProduct, id: "a" })
    const first = getHistory()[0].firstVisitedAt
    const file = JSON.stringify({
      v: 2,
      items: [
        {
          id: "a",
          name: "A",
          url: "https://a.com",
          visitCount: 7,
          lastVisitedAt: "2099-01-01T00:00:00.000Z",
          firstVisitedAt: "2000-01-01T00:00:00.000Z"
        }
      ]
    })
    const res = importHistory(file)
    expect(res.imported).toBe(1)
    const item = getHistory()[0]
    expect(item.visitCount).toBe(7)
    expect(item.lastVisitedAt).toBe("2099-01-01T00:00:00.000Z")
    expect(item.firstVisitedAt).toBe("2000-01-01T00:00:00.000Z")
    expect(first).not.toBe(item.firstVisitedAt)
  })

  it("丢弃缺 id/url 与文件内重复项", () => {
    const file = JSON.stringify([
      { id: "", url: "https://x.com", name: "bad" },
      { id: "a", name: "A", url: "https://a.com" },
      { id: "a", name: "A dup", url: "https://a.com" },
      { id: "b", name: "B", url: "https://b.com" }
    ])
    const res = importHistory(file)
    expect(res.imported).toBe(2)
    expect(res.skipped).toBe(2)
  })

  it("非法 JSON 返回错误且不写入", () => {
    const res = importHistory("{not json")
    expect(res.error).toBeTruthy()
    expect(getHistory()).toEqual([])
  })

  it("格式不符返回错误", () => {
    const res = importHistory(JSON.stringify({ foo: 1 }))
    expect(res.error).toBeTruthy()
    expect(getHistory()).toEqual([])
  })
})

describe("filterHistory", () => {
  const mk = (id: string, categoryId: string, iso: string): HistoryItem => ({
    id,
    name: id,
    url: `https://${id}.com`,
    domain: `${id}.com`,
    categoryId,
    lastVisitedAt: iso,
    firstVisitedAt: iso,
    visitCount: 1
  })
  const now = new Date("2026-03-10T12:00:00")
  const items = [
    mk("today", "chat", "2026-03-10T09:00:00"),
    mk("yesterday", "code", "2026-03-09T09:00:00"),
    mk("week", "chat", "2026-03-05T09:00:00"),
    mk("old", "code", "2026-01-01T09:00:00")
  ]

  it("period=all 返回全部", () => {
    expect(filterHistory(items, {}, now).map((i) => i.id)).toEqual(["today", "yesterday", "week", "old"])
  })

  it("period=today 仅今天", () => {
    expect(filterHistory(items, { period: "today" }, now).map((i) => i.id)).toEqual(["today"])
  })

  it("period=week 含今天共 7 天", () => {
    expect(filterHistory(items, { period: "week" }, now).map((i) => i.id)).toEqual(["today", "yesterday", "week"])
  })

  it("period=month 含今天共 30 天", () => {
    expect(filterHistory(items, { period: "month" }, now).map((i) => i.id)).toEqual(["today", "yesterday", "week"])
  })

  it("categoryId 过滤", () => {
    expect(filterHistory(items, { categoryId: "chat" }, now).map((i) => i.id)).toEqual(["today", "week"])
  })

  it("分类 + 时间联合过滤", () => {
    expect(filterHistory(items, { categoryId: "chat", period: "today" }, now).map((i) => i.id)).toEqual(["today"])
  })

  it("非法日期在时间窗下被排除", () => {
    const bad = mk("bad", "chat", "not-a-date")
    expect(filterHistory([bad], { period: "week" }, now)).toEqual([])
  })
})

describe("getHistoryCategoryIds", () => {
  it("按首次出现顺序去重、忽略空分类", () => {
    const mk = (id: string, categoryId: string): HistoryItem => ({
      id,
      name: id,
      url: `https://${id}.com`,
      domain: `${id}.com`,
      categoryId,
      lastVisitedAt: "2026-03-10T09:00:00",
      firstVisitedAt: "2026-03-10T09:00:00",
      visitCount: 1
    })
    expect(getHistoryCategoryIds([mk("a", "chat"), mk("b", ""), mk("c", "code"), mk("d", "chat")])).toEqual([
      "chat",
      "code"
    ])
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

describe("resolveMaxItems", () => {
  it("未设/空白/非正整数回退 500", () => {
    expect(resolveMaxItems(undefined)).toBe(500)
    expect(resolveMaxItems("")).toBe(500)
    expect(resolveMaxItems(" ")).toBe(500)
    expect(resolveMaxItems("abc")).toBe(500)
    expect(resolveMaxItems("0")).toBe(500)
    expect(resolveMaxItems("-5")).toBe(500)
    expect(resolveMaxItems("100.5")).toBe(500)
  })

  it("正整数原样返回", () => {
    expect(resolveMaxItems("250")).toBe(250)
  })
})

describe("v2 信封上限裁剪", () => {
  beforeEach(() => localStorage.clear())

  it("条目超过上限时保留最前方的 MAX_ITEMS 条", () => {
    const items = Array.from({ length: 505 }, (_, i) => ({
      id: `h-${i}`,
      name: `H${i}`,
      url: `https://h${i}.com`,
      domain: `h${i}.com`,
      categoryId: "",
      lastVisitedAt: "2024-01-01T00:00:00.000Z",
      firstVisitedAt: "2024-01-01T00:00:00.000Z",
      visitCount: 1
    }))
    localStorage.setItem("xigee:history", JSON.stringify({ v: 2, items }))
    const list = getHistory()
    expect(list).toHaveLength(500)
    expect(list[0].id).toBe("h-0")
    expect(list[499].id).toBe("h-499")
  })
})
