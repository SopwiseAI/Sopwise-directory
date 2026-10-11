import Fuse from "fuse.js"
import type { Product } from "./types"

const DEFAULT_THRESHOLD = 0.3

/**
 * 解析搜索阈值环境变量：未设/空白 → 默认 0.3；
 * 合法数字（含 0）限制到 [0,1] 后使用，非法值回退默认。
 * 注意不能用 `||`，否则 `NEXT_PUBLIC_SEARCH_THRESHOLD=0` 会被错误地视为 falsy。
 */
export function resolveThreshold(): number {
  const raw = process.env.NEXT_PUBLIC_SEARCH_THRESHOLD
  if (raw === undefined || raw.trim() === "") return DEFAULT_THRESHOLD
  const n = Number(raw)
  if (!Number.isFinite(n)) return DEFAULT_THRESHOLD
  return Math.min(1, Math.max(0, n))
}

/**
 * 可搜索的产品文档：在 Product 之外预计算 `categoryNames`，
 * 让「对话」这类分类词也能命中所属产品（Fuse 不能直接索引数组映射）。
 */
export interface SearchDoc extends Product {
  categoryNames: string[]
}

/** 把产品 + 分类名映射展开为可索引文档。 */
export function buildSearchDocs(
  products: readonly Product[],
  categoryNames: Readonly<Record<string, string>> = {}
): SearchDoc[] {
  return products.map((p) => ({
    ...p,
    categoryNames: p.categories.map((id) => categoryNames[id]).filter((name): name is string => Boolean(name))
  }))
}

/**
 * 顶栏建议（搜索建议下拉）用的精简文档。
 *
 *刻意不带 `description`：它占了产品数据的四成体积，而下拉只展示「名称 + 分类 + 域名」。
 * 实测 85 条 `SuggestionDoc` ≈ 12KB raw / **3.2KB gzip**（带 description 的全量 SearchDoc 是 6.6KB gzip），
 * 由根布局一次性下发，因此顶栏建议**零网络往返**——这正是旧版「每次换词都要跑一趟服务器」的反面。
 */
export interface SuggestionDoc {
  id: string
  name: string
  url: string
  categories: string[]
  categoryNames: string[]
  tags?: string[]
  /** 与 Product 同源，供 data-history-* 记录访问历史（见 productHistoryAttrs）。 */
  pricing?: Product["pricing"]
}

/** 产品 + 分类名 → 顶栏建议文档。与 buildSearchDocs 同源，保证两处分类名一致。 */
export function buildSuggestionDocs(
  products: readonly Product[],
  categoryNames: Readonly<Record<string, string>> = {}
): SuggestionDoc[] {
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    url: p.url,
    categories: p.categories,
    categoryNames: p.categories.map((id) => categoryNames[id]).filter((name): name is string => Boolean(name)),
    tags: p.tags,
    pricing: p.pricing
  }))
}

/** 顶栏下拉最多展示的条数：够用又不至于盖住整块内容。 */
export const SUGGEST_LIMIT = 6

/** 建议索引按「数据数组身份」缓存：布局每次渲染传的是同一数组，索引只在首建时付一次代价。 */
const suggestionIndexCache = new WeakMap<readonly SuggestionDoc[], Fuse<SuggestionDoc>>()

/** 取（必要时构建）建议索引。服务端首建、客户端命中缓存，顶栏每次挂载不再重建。 */
export function getSuggestionIndex(docs: readonly SuggestionDoc[]): Fuse<SuggestionDoc> {
  const cached = suggestionIndexCache.get(docs)
  if (cached) return cached
  const index = createSuggestionIndex(docs)
  suggestionIndexCache.set(docs, index)
  return index
}

/**
 * 建议索引：只索引 名称 / 标签 / 分类名（不含描述，理由见 SuggestionDoc）。
 * 权重向名称倾斜——下拉是「快速点选」，用户敲的多半是产品名。
 */
export function createSuggestionIndex(docs: readonly SuggestionDoc[]): Fuse<SuggestionDoc> {
  return new Fuse([...docs], {
    keys: [
      { name: "name", weight: 0.5 },
      { name: "tags", weight: 0.3 },
      { name: "categoryNames", weight: 0.2 }
    ],
    threshold: resolveThreshold(),
    ignoreLocation: true,
    includeScore: true
  })
}

/** 取前 N 条建议；空查询直接返回空，避免下拉在输入框为空时闪一下。 */
export function suggest(index: Fuse<SuggestionDoc>, query: string, limit = SUGGEST_LIMIT): SuggestionDoc[] {
  const trimmed = query.trim()
  if (!trimmed) return []
  return index.search(trimmed, { limit }).map((r) => r.item)
}

/**
 * 把文本按查询词切分为「命中/未命中」片段，供 UI 高亮。
 * 按空白拆词、忽略大小写，返回可渲染的片段数组；无有效词时返回整段。
 */
export interface HighlightSegment {
  text: string
  match: boolean
}

export function highlightSegments(text: string, query: string): HighlightSegment[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 0)
  if (!text || terms.length === 0) return [{ text, match: false }]

  const lower = text.toLowerCase()
  // 收集所有命中区间
  const ranges: [number, number][] = []
  for (const term of terms) {
    let from = 0
    while (from <= lower.length - term.length) {
      const idx = lower.indexOf(term, from)
      if (idx === -1) break
      ranges.push([idx, idx + term.length])
      from = idx + term.length
    }
  }
  if (ranges.length === 0) return [{ text, match: false }]

  // 合并重叠区间后切片
  ranges.sort((a, b) => a[0] - b[0])
  const merged: [number, number][] = []
  for (const [start, end] of ranges) {
    const last = merged[merged.length - 1]
    if (last && start <= last[1]) last[1] = Math.max(last[1], end)
    else merged.push([start, end])
  }

  const segments: HighlightSegment[] = []
  let cursor = 0
  for (const [start, end] of merged) {
    if (start > cursor) segments.push({ text: text.slice(cursor, start), match: false })
    segments.push({ text: text.slice(start, end), match: true })
    cursor = end
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), match: false })
  return segments
}

/**
 * 创建模糊搜索索引。维度与权重：名称 0.4 / 描述 0.3 / 标签 0.3 / 分类名 0.2。
 * threshold 越小越精确（见 resolveThreshold）。可传已展开的 SearchDoc 或原始 Product（内部展开）。
 */
export function createSearchIndex(
  products: readonly Product[] | readonly SearchDoc[],
  categoryNames: Readonly<Record<string, string>> = {}
): Fuse<SearchDoc> {
  const docs = (products as readonly Product[]).every((p) => "categoryNames" in p)
    ? (products as readonly SearchDoc[])
    : buildSearchDocs(products, categoryNames)

  return new Fuse(docs, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.3 },
      { name: "categoryNames", weight: 0.2 }
    ],
    threshold: resolveThreshold(),
    ignoreLocation: true,
    includeScore: true
  })
}
