import type { Product } from "./types"

export function getProductDate(product: Product): string {
  return product.publishedAt ?? product.createdAt ?? ""
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
  return a.name.localeCompare(b.name)
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
