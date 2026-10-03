import { PRICINGS, type Pricing } from "@/lib/types"
import { STORAGE_PREFIX, storageKey } from "@/lib/storage"
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

/** 记录历史所需的最小产品信息：避免调用方为满足完整 Product 而填充无关字段（如 description）。 */
export interface HistorySource {
  id: string
  name: string
  url: string
  categories: readonly string[]
  pricing?: Pricing
}

const STORAGE_KEY = storageKey("history")
const SCHEMA_VERSION = 2
const NAV_EVENT = `${STORAGE_PREFIX}:history-change`
const VALID_PRICING: ReadonlySet<string> = new Set(PRICINGS)
const DEFAULT_MAX_ITEMS = 500

/**
 * 解析历史上限环境变量：未设/空白/非正整数 → 默认 500。
 * 不用 `Number(x) || 500`，否则 0 会被吞掉、负值会让 slice 静默丢弃尾部数据。
 */
export function resolveMaxItems(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === "") return DEFAULT_MAX_ITEMS
  const n = Number(raw)
  return Number.isInteger(n) && n > 0 ? n : DEFAULT_MAX_ITEMS
}

const MAX_ITEMS = resolveMaxItems(process.env.NEXT_PUBLIC_HISTORY_MAX_ITEMS)

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
export function addToHistory(product: HistorySource): HistoryItem[] {
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
    categoryId: product.categories[0] ?? existing?.categoryId ?? "",
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

/** 导出为可读的 v2 信封 JSON 字符串，供「导出到文件」。 */
export function getHistoryExport(): string {
  return JSON.stringify({ v: SCHEMA_VERSION, items: getHistory() } satisfies Envelope, null, 2)
}

export interface ImportResult {
  /** 文件中有效且并入的记录数。 */
  imported: number
  /** 被丢弃的条目数（缺 id/url、文件内重复）。 */
  skipped: number
  /** 合并后的最终记录总数。 */
  total: number
  /** 失败原因；成功时为 undefined。 */
  error?: string
}

/**
 * 从 JSON 导入历史并与现有记录合并：
 * 同 id 保留较新的 lastVisitedAt 与较大的 visitCount、较早的 firstVisitedAt；
 * 非法 JSON / 格式不符返回 error 且不写入；成功按 lastVisitedAt 倒序持久化并通知订阅者。
 */
export function importHistory(raw: string): ImportResult {
  if (!isBrowser()) return { imported: 0, skipped: 0, total: 0, error: "当前环境不支持导入" }

  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return { imported: 0, skipped: 0, total: 0, error: "JSON 解析失败" }
  }

  const source: unknown[] | null = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as Envelope).items)
      ? (data as Envelope).items
      : null
  if (!source) {
    return { imported: 0, skipped: 0, total: 0, error: "格式不正确：应为历史数组或 { v, items } 信封" }
  }

  const incoming: HistoryItem[] = []
  const seen = new Set<string>()
  let skipped = 0
  for (const entry of source) {
    const item = normalizeItem(entry)
    if (!item || seen.has(item.id)) {
      skipped++
      continue
    }
    seen.add(item.id)
    incoming.push(item)
  }

  const merged = new Map<string, HistoryItem>(getHistory().map((i) => [i.id, i]))
  for (const item of incoming) {
    const current = merged.get(item.id)
    if (!current) {
      merged.set(item.id, item)
      continue
    }
    const newer = Date.parse(item.lastVisitedAt) >= Date.parse(current.lastVisitedAt) ? item : current
    const older = newer === item ? current : item
    merged.set(item.id, {
      ...newer,
      firstVisitedAt:
        Date.parse(older.firstVisitedAt) < Date.parse(newer.firstVisitedAt)
          ? older.firstVisitedAt
          : newer.firstVisitedAt,
      visitCount: Math.max(current.visitCount, item.visitCount)
    })
  }

  const ordered = [...merged.values()].sort((a, b) => Date.parse(b.lastVisitedAt) - Date.parse(a.lastVisitedAt))
  const saved = persist(ordered)
  if (!saved) return { imported: 0, skipped, total: 0, error: "写入失败：本地存储不可用" }
  notify()
  return { imported: incoming.length, skipped, total: saved.length }
}

/** 按 id 查询单条历史 */
export function getHistoryItem(id: string): HistoryItem | undefined {
  if (!isBrowser()) return undefined
  return getHistory().find((i) => i.id === id)
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

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/** 在本地日历上平移天数，避免固定 86_400_000 在 DST 时区出现偏差。 */
function shiftDays(ts: number, days: number): number {
  const d = new Date(ts)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days).getTime()
}

/** 按本地日期分组：今天 / 昨天 / 近 7 天 / 更早。
 *  @deprecated 历史页已改为平铺 + 筛选，不再使用分组；保留供兼容与测试。 */
export function groupHistoryByPeriod(items: HistoryItem[] = getHistory(), now?: Date): HistoryGroup[] {
  const effectiveNow = now ?? new Date()
  const todayStart = startOfDay(effectiveNow)
  const yesterdayStart = shiftDays(todayStart, -1)
  const weekStart = shiftDays(todayStart, -6)
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

/** 时间筛选维度：全部 / 今天 / 近 7 天 / 近 30 天。 */
export type HistoryPeriod = "all" | "today" | "week" | "month"

export const HISTORY_PERIODS: readonly { value: HistoryPeriod; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "today", label: "今天" },
  { value: "week", label: "近 7 天" },
  { value: "month", label: "近 30 天" }
]

export interface HistoryFilter {
  /** 分类 id；空串/undefined 表示全部分类。 */
  categoryId?: string
  period?: HistoryPeriod
}

/**
 * 按分类与时间窗过滤历史（不做分组，由 UI 平铺展示）。
 * 时间窗基于本地自然日边界：今天从 00:00 起，近 7 天含今天共 7 天，近 30 天含今天共 30 天。
 */
export function filterHistory(
  items: readonly HistoryItem[],
  { categoryId, period = "all" }: HistoryFilter = {},
  now: Date = new Date()
): HistoryItem[] {
  const todayStart = startOfDay(now)
  const lowerBound =
    period === "today"
      ? todayStart
      : period === "week"
        ? shiftDays(todayStart, -6)
        : period === "month"
          ? shiftDays(todayStart, -29)
          : null

  return items.filter((item) => {
    if (categoryId && item.categoryId !== categoryId) return false
    if (lowerBound === null) return true
    const t = Date.parse(item.lastVisitedAt)
    if (Number.isNaN(t)) return false
    return t >= lowerBound
  })
}

/** 从历史中提取出现过的分类 id（去重，保持首次出现顺序），供筛选下拉使用。 */
export function getHistoryCategoryIds(items: readonly HistoryItem[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const item of items) {
    if (item.categoryId && !seen.has(item.categoryId)) {
      seen.add(item.categoryId)
      out.push(item.categoryId)
    }
  }
  return out
}
