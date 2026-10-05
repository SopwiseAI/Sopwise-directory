"use client"

import { useEffect } from "react"
import { PRICINGS, type Pricing } from "@/lib/types"
import { addToHistory } from "@/lib/history"

const VALID_PRICING = new Set<string>(PRICINGS)

/**
 * 全局历史捕捉器：事件委托监听所有带 data-history-* 的产品链接点击，
 * 记录访问历史（localStorage）。挂在布局根部，零组件改动记录历史。
 * 覆盖左键/键盘回车（含 ctrl/cmd/shift 新标签、新窗口）与中键 auxclick；
 * 历史页自身的条目也带 data-history-*，故访问历史里的产品会回写时间与次数。
 */
export function HistoryTracker() {
  useEffect(() => {
    const record = (target: EventTarget | null) => {
      if (!(target instanceof Element)) return
      const link = target.closest<HTMLElement>("a[data-history-id]")
      if (!link) return

      const id = link.dataset.historyId
      if (!id) return

      const pricing = link.dataset.historyPricing
      addToHistory({
        id,
        name: link.dataset.historyName ?? id,
        url: link.dataset.historyUrl ?? "",
        categories: link.dataset.historyCategory ? [link.dataset.historyCategory] : [],
        pricing: pricing && VALID_PRICING.has(pricing) ? (pricing as Pricing) : undefined
      })
    }

    // 主键激活：左键 / 键盘回车，含 ctrl/cmd/shift 新标签、新窗口
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0) return
      if (e.defaultPrevented) return
      record(e.target)
    }
    // 中键「在新标签打开」不触发 click，走 auxclick；仅记录 button===1
    const onAuxClick = (e: MouseEvent) => {
      if (e.button !== 1) return
      record(e.target)
    }

    // capture 阶段捕获，确保先于链接默认行为
    document.addEventListener("click", onClick, true)
    document.addEventListener("auxclick", onAuxClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      document.removeEventListener("auxclick", onAuxClick, true)
    }
  }, [])

  return null
}
