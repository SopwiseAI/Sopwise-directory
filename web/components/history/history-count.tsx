"use client"

import { useSyncExternalStore } from "react"
import { getHistorySnapshot, parseHistorySnapshot, subscribeHistory } from "@/lib/history"

/** 稳定的计数值快照（返回数字，按值比较，避免 useSyncExternalStore 反复重渲染）。
 *  以 raw 字符串为键缓存解析结果：同一条快照多次读取不再重复 JSON.parse。 */
let cachedRaw: string | null = null
let cachedCount = 0

function getHistoryCount(): number {
  const raw = getHistorySnapshot()
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedCount = parseHistorySnapshot(raw).length
  }
  return cachedCount
}

/**
 * 订阅本地历史条数。
 * 始终返回数字（含 0），与侧栏其它计数（产品/分类数）保持同一口径。
 */
export function useHistoryCount(): number {
  return useSyncExternalStore(subscribeHistory, getHistoryCount, () => 0)
}
