import { describe, it, expect } from "vitest"
import { getProductDate, productHistoryAttrs } from "./product-utils"
import type { Product } from "./types"

const mockProduct: Product = {
  id: "test-1",
  name: "Test Product",
  description: "A test product",
  url: "https://test.com",
  categoryId: "test-cat",
  tags: ["test"],
  pricing: "free",
  featured: false,
  createdAt: "2024-01-01"
}

describe("getProductDate", () => {
  it("returns publishedAt when available", () => {
    const p = { ...mockProduct, publishedAt: "2024-06-01" }
    expect(getProductDate(p)).toBe("2024-06-01")
  })

  it("falls back to createdAt", () => {
    expect(getProductDate(mockProduct)).toBe("2024-01-01")
  })

  it("returns empty string when neither exists", () => {
    const p = { ...mockProduct, createdAt: undefined }
    expect(getProductDate(p)).toBe("")
  })
})

describe("productHistoryAttrs", () => {
  it("generates correct data attributes", () => {
    const attrs = productHistoryAttrs(mockProduct)
    expect(attrs["data-history-id"]).toBe("test-1")
    expect(attrs["data-history-name"]).toBe("Test Product")
    expect(attrs["data-history-url"]).toBe("https://test.com")
    expect(attrs["data-history-category"]).toBe("test-cat")
    expect(attrs["data-history-pricing"]).toBe("free")
  })

  it("handles missing pricing", () => {
    const p = { ...mockProduct, pricing: undefined }
    const attrs = productHistoryAttrs(p)
    expect(attrs["data-history-pricing"]).toBe("")
  })
})
