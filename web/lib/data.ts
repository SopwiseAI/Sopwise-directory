import "server-only"
import data from "@/data/data.json"
import { PRICINGS, type Category, type Product, type SiteData } from "./types"

const PRICING_SET: ReadonlySet<string> = new Set(PRICINGS)

function assertString(val: unknown, field: string): string {
  if (typeof val !== "string" || !val.trim()) {
    throw new Error(`[data] 字段 ${field} 必须为非空字符串，实际值: ${JSON.stringify(val)}`)
  }
  return val
}

function assertCategory(raw: unknown): Category {
  if (!raw || typeof raw !== "object") throw new Error("[data] 无效的分类条目")
  const r = raw as Record<string, unknown>
  return {
    id: assertString(r.id, "category.id"),
    name: assertString(r.name, "category.name"),
    icon: assertString(r.icon, "category.icon")
  }
}

function assertProduct(raw: unknown): Product {
  if (!raw || typeof raw !== "object") throw new Error("[data] 无效的产品条目")
  const r = raw as Record<string, unknown>
  const id = assertString(r.id, "product.id")
  const pricing = r.pricing
  if (pricing !== undefined) {
    if (typeof pricing !== "string" || !PRICING_SET.has(pricing)) {
      throw new Error(`[data] 产品 "${id}" 的 pricing 非法: ${JSON.stringify(pricing)}`)
    }
  }
  const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === "string") : undefined
  return {
    id,
    name: assertString(r.name, `product[${id}].name`),
    description: typeof r.description === "string" ? r.description : "",
    url: assertString(r.url, `product[${id}].url`),
    categoryId: assertString(r.categoryId, `product[${id}].categoryId`),
    tags: tags && tags.length > 0 ? tags : undefined,
    pricing: pricing as Product["pricing"],
    featured: typeof r.featured === "boolean" ? r.featured : undefined,
    publishedAt: typeof r.publishedAt === "string" ? r.publishedAt : undefined,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined
  }
}

function assertSiteData(raw: unknown): SiteData {
  if (!raw || typeof raw !== "object") throw new Error("[data] data.json 根节点必须为对象")
  const r = raw as Record<string, unknown>
  if (!Array.isArray(r.categories)) throw new Error("[data] categories 必须为数组")
  if (!Array.isArray(r.products)) throw new Error("[data] products 必须为数组")
  const categories = r.categories.map(assertCategory)
  const products = r.products.map(assertProduct)
  const catIds = new Set(categories.map((c) => c.id))
  if (catIds.size !== categories.length) throw new Error("[data] 存在重复的 category id")
  const productIds = new Set<string>()
  for (const p of products) {
    if (productIds.has(p.id)) throw new Error(`[data] 存在重复的 product id: ${p.id}`)
    productIds.add(p.id)
    if (!catIds.has(p.categoryId)) {
      throw new Error(`[data] 产品 "${p.id}" 引用了不存在的 categoryId "${p.categoryId}"`)
    }
  }
  return { categories, products }
}

const siteData = assertSiteData(data)

export function getAllCategories(): readonly Category[] {
  return siteData.categories
}

export function getCategoryById(id: string): Category | undefined {
  return siteData.categories.find((c) => c.id === id)
}

export function getAllProducts(): readonly Product[] {
  return siteData.products
}

export function getFeaturedProducts(): readonly Product[] {
  return siteData.products.filter((p) => p.featured)
}

export function getProductsByCategory(categoryId: string): readonly Product[] {
  return siteData.products.filter((p) => p.categoryId === categoryId)
}

/** categoryId → 已发布产品数，供 sidebar/nav/footer 共用。 */
export function getCategoryCounts(): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const p of siteData.products) {
    counts[p.categoryId] = (counts[p.categoryId] ?? 0) + 1
  }
  return counts
}

export interface SiteStats {
  products: number
  categories: number
  featured: number
}

/** 站点统计：供 settings/brand-showcase 共用。 */
export function getStats(): SiteStats {
  return {
    products: siteData.products.length,
    categories: siteData.categories.length,
    featured: getFeaturedProducts().length
  }
}
