"use client"

import { useMemo, useSyncExternalStore } from "react"
import { getHistorySnapshot, parseHistorySnapshot, subscribeHistory } from "@/lib/history"

/** 侧栏历史记录角标：订阅本地历史条数，动态更新（带紧凑动画） */
export function HistoryCount() {
  const raw = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => "[]")
  const count = useMemo(() => parseHistorySnapshot(raw).length, [raw])

  if (count === 0) return null

  return (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 font-data tabular-nums text-primary">
      {count > 99 ? "99+" : count}
    </span>
  )
}
