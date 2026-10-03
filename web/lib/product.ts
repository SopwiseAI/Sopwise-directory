import type { Product } from "./types"

export function getProductDate(product: Product): string {
  return product.publishedAt ?? product.createdAt ?? ""
}

/**
 * 名称比较器（SSG 确定性）：显式指定 zh-CN，避免 localeCompare 默认 locale
 * 在服务端（Node）与客户端（浏览器）不一致导致 hydration mismatch。
 */
const nameCollator = new Intl.Collator("zh-CN", { numeric: true, sensitivity: "base" })

export function compareName(a: Product, b: Product): number {
  return nameCollator.compare(a.name, b.name)
}

/**
 * 综合排序比较器：精选优先 → 发布日期倒序 → 名称升序（确定性）。
 * 供「全部」tab 默认排序使用，避免与「最新」tab 的纯时间排序语义重复。
 */
export function compareRecommended(a: Product, b: Product): number {
  const fa = a.featured ? 1 : 0
  const fb = b.featured ? 1 : 0
  if (fa !== fb) return fb - fa
  const dateCmp = getProductDate(b).localeCompare(getProductDate(a))
  if (dateCmp !== 0) return dateCmp
  return compareName(a, b)
}

export function productHistoryAttrs(product: Product): Record<string, string> {
  return {
    "data-history-id": product.id,
    "data-history-name": product.name,
    "data-history-url": product.url,
    "data-history-category": product.categories[0] ?? "",
    "data-history-pricing": product.pricing ?? ""
  }
}
