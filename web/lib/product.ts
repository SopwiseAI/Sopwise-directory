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

/** 取日期部分（YYYY-MM-DD），忽略时间与时区，保证跨格式比较的确定性。 */
function dateOnly(value: string): string {
  return value.slice(0, 10)
}

/**
 * 日期倒序比较器（确定性）：仅比较 YYYY-MM-DD 部分，避免混入 ISO 时间后
 * 默认 locale 的 localeCompare 在服务端/客户端产生不一致。空日期排最后。
 */
export function compareDateDesc(a: string, b: string): number {
  const da = dateOnly(a)
  const db = dateOnly(b)
  if (!da && !db) return 0
  if (!da) return 1
  if (!db) return -1
  if (da === db) return 0
  return da < db ? 1 : -1
}

/**
 * 综合排序比较器：精选优先 → 发布日期倒序 → 名称升序（确定性）。
 * 供「全部」tab 默认排序使用，避免与「最新」tab 的纯时间排序语义重复。
 */
export function compareRecommended(a: Product, b: Product): number {
  const fa = a.featured ? 1 : 0
  const fb = b.featured ? 1 : 0
  if (fa !== fb) return fb - fa
  const dateCmp = compareDateDesc(getProductDate(a), getProductDate(b))
  if (dateCmp !== 0) return dateCmp
  return compareName(a, b)
}

/** 一组产品中最新的日期（原始串）；无日期返回 null。按日期部分比较，容忍格式差异。 */
export function latestProductDate(products: readonly Product[]): string | null {
  let latest: string | null = null
  for (const p of products) {
    const date = getProductDate(p)
    if (!date) continue
    if (latest === null || dateOnly(date) > dateOnly(latest)) latest = date
  }
  return latest
}

/**
 * 生成 data-history-* 属性所需的最小字段集：结果行（`Product`）与顶栏搜索建议
 * （`SuggestionDoc`）共用同一套历史埋点，点击 / 键盘回车打开都会被根部 HistoryTracker 记录。
 */
export interface HistoryLinkable {
  id: string
  name: string
  url: string
  categories: readonly string[]
  pricing?: Product["pricing"]
}

export function productHistoryAttrs(product: HistoryLinkable): Record<string, string> {
  return {
    "data-history-id": product.id,
    "data-history-name": product.name,
    "data-history-url": product.url,
    "data-history-category": product.categories[0] ?? "",
    "data-history-pricing": product.pricing ?? ""
  }
}
