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

export function createSearchIndex(products: readonly Product[]): Fuse<Product> {
  return new Fuse(products, {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "description", weight: 0.3 },
      { name: "tags", weight: 0.3 }
    ],
    threshold: resolveThreshold(),
    ignoreLocation: true,
    includeScore: true
  })
}
