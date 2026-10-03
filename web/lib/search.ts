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
