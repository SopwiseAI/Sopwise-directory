"use client"

import { useEffect } from "react"
import type { Product } from "@/lib/types"
import { addToHistory } from "@/lib/history"

/**
 * 全局历史捕捉器：事件委托监听所有带 data-history-* 的产品链接点击，
 * 记录访问历史（localStorage）。挂在布局根部，零组件改动记录历史。
 */
export function HistoryTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      // 仅记录普通左键点击（排除 ctrl/cmd 新标签、中键）
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const target = e.target as HTMLElement | null
      const link = target?.closest?.<HTMLElement>("a[data-history-id]")
      if (!link) return

      const id = link.dataset.historyId
      if (!id) return

      const product: Product = {
        id,
        name: link.dataset.historyName ?? id,
        url: link.dataset.historyUrl ?? "",
        categoryId: link.dataset.historyCategory ?? "",
        description: "",
        createdAt: "",
        pricing: (link.dataset.historyPricing as Product["pricing"]) || undefined,
      }
      addToHistory(product)
    }

    // capture 阶段捕获，确保先于链接默认行为
    document.addEventListener("click", onClick, true)
    return () => document.removeEventListener("click", onClick, true)
  }, [])

  return null
}