import { describe, it, expect, beforeEach, vi } from "vitest"
import { addToHistory, removeFromHistory, clearHistory, getHistory, subscribeHistory } from "./history"
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

  it("trims to 200 items max", () => {
    for (let i = 0; i < 205; i++) {
      addToHistory({ ...mockProduct, id: `p-${i}`, name: `Product ${i}` })
    }
    const list = getHistory()
    expect(list).toHaveLength(200)
    expect(list[0].id).toBe("p-204")
    expect(list[199].id).toBe("p-5")
  })
})

describe("removeFromHistory", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("removes the specified item", () => {
    addToHistory({ ...mockProduct, id: "a" })
    addToHistory({ ...mockProduct, id: "b" })
    removeFromHistory("a")
    const list = getHistory()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe("b")
  })

  it("does nothing if id not found", () => {
    addToHistory({ ...mockProduct, id: "a" })
    removeFromHistory("nonexistent")
    expect(getHistory()).toHaveLength(1)
  })
})

describe("clearHistory", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("removes all items", () => {
    addToHistory(mockProduct)
    addToHistory({ ...mockProduct, id: "test-2" })
    clearHistory()
    expect(getHistory()).toHaveLength(0)
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
