import { describe, it, expect } from "vitest"
import { getAllCategories, getAllProducts, getCategoryById, getFeaturedProducts, getProductsByCategory } from "./data"
import { CATEGORY_ICONS } from "./category-icon-node"

describe("数据完整性不变式", () => {
  const categories = getAllCategories()
  const products = getAllProducts()

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

  it("所有 product.categoryId 都引用了已存在的 category", () => {
    const catIds = new Set(categories.map((c) => c.id))
    for (const p of products) {
      expect(catIds.has(p.categoryId)).toBe(true)
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
    for (const p of list) expect(p.categoryId).toBe(cat.id)
  })

  it("returns empty for unknown categoryId", () => {
    expect(getProductsByCategory("no-such-cat")).toEqual([])
  })
})
