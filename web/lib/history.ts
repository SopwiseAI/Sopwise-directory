import { PRICINGS, type Pricing, type Product } from "@/lib/types"
import { getDomain } from "@/lib/url"

export interface HistoryItem {
  id: string
  name: string
  url: string
  domain: string
  categoryId: string
  pricing?: Pricing
  /** 最近一次访问时间 (ISO)。 */
  lastVisitedAt: string
  /** 首次访问时间 (ISO)。 */
  firstVisitedAt: string
  /** 累计访问次数。 */
  visitCount: number
}

export interface HistoryGroup {
  label: string
  items: HistoryItem[]
}

const STORAGE_KEY = "xigee:history"
/** 存储结构版本：1 = 裸数组（旧），2 = 版本化信封。 */
const SCHEMA_VERSION = 2
/** 保留上限 500 条：覆盖长期使用，超出自动淘汰最旧条目（见 persist）。 */
const MAX_ITEMS = 500
const NAV_EVENT = "xigee:history-change"
const VALID_PRICING: ReadonlySet<string> = new Set(PRICINGS)

interface Envelope {
  v: number
  items: HistoryItem[]
}

interface HistoryCache {
  raw: string
  items: HistoryItem[]
  index: Map<string, HistoryItem>
}

let cache: HistoryCache | null = null

function isBrowser() {
  return typeof window !== "undefined"
}

/** 触发历史变更通知（供 useSyncExternalStore 订阅） */
function notify() {
  if (!isBrowser()) return
  window.dispatchEvent(new Event(NAV_EVENT))
}

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function setCache(raw: string, items: HistoryItem[]) {
  cache = { raw, items, index: new Map(items.map((i) => [i.id, i])) }
}

function toIso(value: unknown): string | null {
  if (typeof value !== "string") return null
  const t = Date.parse(value)
  return Number.isNaN(t) ? null : new Date(t).toISOString()
}

/** 字段校验与清洗：修复可修复项，无法修复（缺 id/url）返回 null 由上层丢弃。 */
function normalizeItem(raw: unknown): HistoryItem | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, unknown>
  const id = typeof r.id === "string" ? r.id.trim() : ""
  const url = typeof r.url === "string" ? r.url.trim() : ""
  if (!id || !url) return null
  const name = typeof r.name === "string" && r.name.trim() ? r.name.trim() : id
  const domain = typeof r.domain === "string" && r.domain.trim() ? r.domain.trim() : getDomain(url)
  const categoryId = typeof r.categoryId === "string" ? r.categoryId : ""
  const pricing = typeof r.pricing === "string" && VALID_PRICING.has(r.pricing) ? (r.pricing as Pricing) : undefined
  // 兼容旧字段 visitedAt；日期非法兜底为当前时间。
  const lastVisitedAt = toIso(r.lastVisitedAt) ?? toIso(r.visitedAt) ?? new Date().toISOString()
  const firstVisitedAt = toIso(r.firstVisitedAt) ?? lastVisitedAt
  const count = Number(r.visitCount)
  const visitCount = Number.isFinite(count) && count >= 1 ? Math.floor(count) : 1
  return { id, name, url, domain, categoryId, pricing, lastVisitedAt, firstVisitedAt, visitCount }
}

/** 解析与迁移：裸数组（v1）自动升级为 v2 语义，非法 JSON 返回空数组。 */
function parseRaw(raw: string | null): HistoryItem[] {
  if (!raw) return []
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return []
  }
  const source = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Envelope).items)
      ? (data as Envelope).items
      : []
  const out: HistoryItem[] = []
  const seen = new Set<string>()
  for (const entry of source) {
    const item = normalizeItem(entry)
    if (!item || seen.has(item.id)) continue
    seen.add(item.id)
    out.push(item)
  }
  return out.slice(0, MAX_ITEMS)
}

/**
 * 解析快照字符串（版本化信封或旧版裸数组）为归一化后的历史列表。
 * 供消费方从 useSyncExternalStore 的快照字符串复用同一套解析/迁移逻辑。
 */
export function parseHistorySnapshot(raw: string): HistoryItem[] {
  return parseRaw(raw)
}

/**
 * 写入存储：单次解析、按 raw 缓存。
 * 配额不足（QuotaExceededError）时按 80% 递减裁剪重试，最终退化为空集合；
 * 所有失败路径返回 null，由调用方回退到上一份有效数据。
 */
function persist(items: HistoryItem[]): HistoryItem[] | null {
  let attempt = items.slice(0, MAX_ITEMS)
  while (attempt.length > 0) {
    const serialized = JSON.stringify({ v: SCHEMA_VERSION, items: attempt } satisfies Envelope)
    try {
      localStorage.setItem(STORAGE_KEY, serialized)
      setCache(serialized, attempt)
      return attempt.slice()
    } catch {
      const nextLen = Math.floor(attempt.length * 0.8)
      if (nextLen >= attempt.length) break
      console.warn(`[history] 存储配额不足，裁剪记录至 ${nextLen} 条后重试`)
      attempt = attempt.slice(0, nextLen)
    }
  }
  const empty = JSON.stringify({ v: SCHEMA_VERSION, items: [] } satisfies Envelope)
  try {
    localStorage.setItem(STORAGE_KEY, empty)
    setCache(empty, [])
    return []
  } catch {
    return null
  }
}

export function getHistory(): HistoryItem[] {
  if (!isBrowser()) return []
  const raw = readRaw()
  if (cache && cache.raw === (raw ?? "")) return cache.items.slice()
  const items = parseRaw(raw)
  setCache(raw ?? "", items)
  return items.slice()
}

/**
 * 访问产品时记录：同产品置顶去重并递增访问次数，保留首次访问时间；
 * 超出上限裁剪最旧条目（切片）。
 */
export function addToHistory(product: Product): HistoryItem[] {
  if (!isBrowser()) return getHistory()
  const now = new Date().toISOString()
  const list = getHistory()
  const existing = list.find((i) => i.id === product.id)
  const rest = list.filter((i) => i.id !== product.id)
  const url = product.url || existing?.url || ""
  // 无有效 URL 的记录无法渲染为链接，且会在下次读取时被归一化丢弃，直接拒绝保持行为一致。
  if (!url) return list
  const item: HistoryItem = {
    id: product.id,
    name: product.name || existing?.name || product.id,
    url,
    domain: getDomain(url),
    categoryId: product.categoryId || existing?.categoryId || "",
    pricing: product.pricing ?? existing?.pricing,
    lastVisitedAt: now,
    firstVisitedAt: existing?.firstVisitedAt ?? now,
    visitCount: (existing?.visitCount ?? 0) + 1
  }
  const saved = persist([item, ...rest])
  if (!saved) return list
  notify()
  return saved
}

/** 移除单条历史；不存在时不写存储、不派发事件。 */
export function removeFromHistory(id: string): HistoryItem[] {
  if (!isBrowser()) return getHistory()
  const list = getHistory()
  const next = list.filter((i) => i.id !== id)
  if (next.length === list.length) return list
  const saved = persist(next)
  if (!saved) return list
  notify()
  return saved
}

/** 清空全部历史 */
export function clearHistory(): HistoryItem[] {
  if (!isBrowser()) return []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    return getHistory()
  }
  setCache("", [])
  notify()
  return []
}

/** 按 id 查询单条历史（走缓存索引） */
export function getHistoryItem(id: string): HistoryItem | undefined {
  if (!isBrowser()) return undefined
  getHistory()
  return cache?.index.get(id)
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

const DAY_MS = 86_400_000

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** 按本地日期分组：今天 / 昨天 / 近 7 天 / 更早，组内保持原顺序（最近访问在前）。 */
export function groupHistoryByPeriod(items: HistoryItem[] = getHistory(), now: Date = new Date()): HistoryGroup[] {
  const todayStart = startOfDay(now)
  const yesterdayStart = todayStart - DAY_MS
  const weekStart = todayStart - 6 * DAY_MS
  const bucket: Record<string, HistoryItem[]> = { 今天: [], 昨天: [], "近 7 天": [], 更早: [] }
  for (const item of items) {
    const t = Date.parse(item.lastVisitedAt)
    const dayStart = startOfDay(new Date(Number.isNaN(t) ? 0 : t))
    if (dayStart >= todayStart) bucket["今天"].push(item)
    else if (dayStart >= yesterdayStart) bucket["昨天"].push(item)
    else if (dayStart >= weekStart) bucket["近 7 天"].push(item)
    else bucket["更早"].push(item)
  }
  return Object.entries(bucket)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, items: list }))
}
