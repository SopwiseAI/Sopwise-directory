"use client"

import { useSyncExternalStore } from "react"
import { getHistorySnapshot, parseHistorySnapshot, subscribeHistory } from "@/lib/history"

/** 稳定的计数值快照（返回数字，按值比较，避免 useSyncExternalStore 反复重渲染）。 */
function getHistoryCount(): number {
  return parseHistorySnapshot(getHistorySnapshot()).length
}

/**
 * 订阅本地历史条数。
 * 始终返回数字（含 0），与侧栏其它计数（产品/分类数）保持同一口径。
 */
export function useHistoryCount(): number {
  return useSyncExternalStore(subscribeHistory, getHistoryCount, () => 0)
}
