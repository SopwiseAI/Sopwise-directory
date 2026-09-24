import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/product-icon"

export interface HistoryItem {
  id: string
  name: string
  url: string
  domain: string
  categoryId: string
  pricing?: Product["pricing"]
  visitedAt: string
}

const STORAGE_KEY = "ailulu:history"
/** 保留上限 200 条：localStorage 容量充足（约 200KB），覆盖长期使用；
    超出自动淘汰最旧条目（见 addToHistory 的 slice）。 */
const MAX_ITEMS = 200
const NAV_EVENT = "ailulu:history-change"

function isBrowser() {
  return typeof window !== "undefined"
}

/** 触发历史变更通知（供 useSyncExternalStore 订阅） */
function notify() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function getHistory(): HistoryItem[] {
  if (!isBrowser()) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const items = JSON.parse(raw) as HistoryItem[]
    return Array.isArray(items) ? items : []
  } catch {
    return []
  }
}

/** 访问产品时记录：同产品置顶去重，超出上限裁剪 */
export function addToHistory(product: Product): HistoryItem[] {
  if (!isBrowser()) return getHistory()
  const list = getHistory().filter((i) => i.id !== product.id)
  list.unshift({
    id: product.id,
    name: product.name,
    url: product.url,
    domain: getDomain(product.url),
    categoryId: product.categoryId,
    pricing: product.pricing,
    visitedAt: new Date().toISOString(),
  })
  const next = list.slice(0, MAX_ITEMS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    return getHistory()
  }
  notify()
  return next
}

/** 移除单条历史 */
export function removeFromHistory(id: string): HistoryItem[] {
  if (!isBrowser()) return getHistory()
  const next = getHistory().filter((i) => i.id !== id)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    return getHistory()
  }
  notify()
  return next
}

/** 清空全部历史 */
export function clearHistory(): HistoryItem[] {
  if (!isBrowser()) return []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    return getHistory()
  }
  notify()
  return []
}

export function subscribeHistory(callback: () => void) {
  if (!isBrowser()) return () => {}
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener("storage", storageHandler)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    window.removeEventListener("storage", storageHandler)
    window.removeEventListener(NAV_EVENT, callback)
  }
}

export function getHistorySnapshot() {
  if (!isBrowser()) return "[]"
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]"
  } catch {
    return "[]"
  }
}