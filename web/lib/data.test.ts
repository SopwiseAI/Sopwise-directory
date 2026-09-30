import { describe, it, expect } from "vitest"
import {
  getAllCategories,
  getAllProducts,
  getCategoryById,
  getCategoryCounts,
  getFeaturedProducts,
  getProductsByCategory,
  getStats
} from "./data"
import { CATEGORY_ICONS } from "./category-icon-node"

const categories = getAllCategories()
const products = getAllProducts()

describe("数据完整性不变式", () => {
  it("categories 与 products 均非空", () => {
    expect(categories.length).toBeGreaterThan(0)
    expect(products.length).toBeGreaterThan(0)
  })

  it("category id 唯一", () => {
    const ids = categories.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("product id 唯一", () => {
    const ids = products.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("所有 product.categories 都引用了已存在的 category", () => {
    const catIds = new Set(categories.map((c) => c.id))
    for (const p of products) {
      for (const cid of p.categories) {
        expect(catIds.has(cid)).toBe(true)
      }
    }
  })

  it("所有 category.icon 都能在 iconMap 中解析", () => {
    for (const c of categories) {
      expect(CATEGORY_ICONS).toHaveProperty(c.icon)
    }
  })
})

describe("getCategoryById", () => {
  it("returns category for valid id", () => {
    const first = getAllCategories()[0]
    expect(getCategoryById(first.id)?.id).toBe(first.id)
  })

  it("returns undefined for unknown id", () => {
    expect(getCategoryById("definitely-does-not-exist")).toBeUndefined()
  })
})

describe("getFeaturedProducts", () => {
  it("only returns featured=true products", () => {
    const featured = getFeaturedProducts()
    expect(featured.length).toBeGreaterThan(0)
    for (const p of featured) expect(p.featured).toBe(true)
  })
})

describe("getProductsByCategory", () => {
  it("returns products matching categoryId", () => {
    const cat = getAllCategories()[0]
    const list = getProductsByCategory(cat.id)
    for (const p of list) expect(p.categories).toContain(cat.id)
  })

  it("returns empty for unknown categoryId", () => {
    expect(getProductsByCategory("no-such-cat")).toEqual([])
  })
})

describe("getCategoryCounts", () => {
  it("去重后总数等于各产品分类引用数之和", () => {
    const counts = getCategoryCounts()
    const total = products.reduce((n, p) => n + p.categories.length, 0)
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(total)
  })

  it("被任一产品引用的分类计数至少为 1", () => {
    const counts = getCategoryCounts()
    for (const p of products) {
      for (const cid of p.categories) expect(counts[cid]).toBeGreaterThanOrEqual(1)
    }
  })
})

describe("getStats", () => {
  it("与源数据一致", () => {
    const stats = getStats()
    expect(stats.products).toBe(products.length)
    expect(stats.categories).toBe(categories.length)
    expect(stats.featured).toBe(products.filter((p) => p.featured).length)
  })
})
