import { STORAGE_PREFIX, storageKey } from "./storage"

const STORAGE_KEY = storageKey("recent-searches")
const NAV_EVENT = `${STORAGE_PREFIX}:recent-searches-change`

/** 最近搜索最多保留的条数：够「回到刚才那条」，又不至于把空查询页堆成历史墙。 */
export const RECENT_SEARCH_LIMIT = 8

/** 单条查询词长度上限：挡住把整段文本粘进搜索框后塞满历史的情况。 */
const MAX_QUERY_LENGTH = 60

function isBrowser(): boolean {
  return typeof window !== "undefined"
}

/** 归一化：去首尾空白、把连续空白压成一个空格、截断超长。 */
export function normalizeQuery(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY_LENGTH)
}

/** 解析快照：非法 JSON / 非数组 → 空；逐条归一化并按大小写不敏感去重。 */
export function parseRecentSearches(raw: string | null): string[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(data)) return []

  const out: string[] = []
  const seen = new Set<string>()
  for (const entry of data) {
    if (typeof entry !== "string") continue
    const query = normalizeQuery(entry)
    const key = query.toLowerCase()
    if (!query || seen.has(key)) continue
    seen.add(key)
    out.push(query)
    if (out.length >= RECENT_SEARCH_LIMIT) break
  }
  return out
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function notify(): void {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function getRecentSearches(): string[] {
  if (!isBrowser()) return []
  return parseRecentSearches(readRaw())
}

function persist(list: readonly string[]): string[] {
  const next = list.slice(0, RECENT_SEARCH_LIMIT)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // 隐私模式/配额不足：保持上一次有效值，不让调用方拿到半截状态
    return getRecentSearches()
  }
  notify()
  return next
}

/** 记录一次搜索：大小写不敏感去重、最新在前、超出上限裁掉最旧。 */
export function addRecentSearch(raw: string): string[] {
  if (!isBrowser()) return []
  const query = normalizeQuery(raw)
  if (!query) return getRecentSearches()
  const rest = getRecentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase())
  return persist([query, ...rest])
}

/** 删除单条；不存在时不写存储、不派发事件。 */
export function removeRecentSearch(raw: string): string[] {
  if (!isBrowser()) return []
  const key = normalizeQuery(raw).toLowerCase()
  const list = getRecentSearches()
  const next = list.filter((item) => item.toLowerCase() !== key)
  if (next.length === list.length) return list
  return persist(next)
}

export function clearRecentSearches(): string[] {
  if (!isBrowser()) return []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    return getRecentSearches()
  }
  notify()
  return []
}

export function subscribeRecentSearches(callback: () => void): () => void {
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

export function getRecentSearchesSnapshot(): string {
  if (!isBrowser()) return "[]"
  return readRaw() ?? "[]"
}
