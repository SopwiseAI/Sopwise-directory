import type { Product } from "./types"

export function getProductDate(product: Product): string {
  return product.publishedAt ?? product.createdAt ?? ""
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
