"use client"

import { STORAGE_PREFIX, storageKey } from "@/lib/storage"
import { isValidSort, isValidTab, isValidView, type SortMode, type TabMode, type ViewMode } from "@/lib/product-query"

export const DEFAULT_VIEW: ViewMode = "grid"
export const DEFAULT_SORT: SortMode = "latest"
export const DEFAULT_TAB: TabMode = "all"

const KEYS = {
  view: storageKey("default-view"),
  sort: storageKey("default-sort"),
  tab: storageKey("default-tab")
} as const

const PREFERENCE_KEYS: readonly string[] = [KEYS.view, KEYS.sort, KEYS.tab]
const NAV_EVENT = `${STORAGE_PREFIX}:preferences-change`

function read(key: string): string {
  if (typeof window === "undefined") return ""
  try {
    return localStorage.getItem(key) ?? ""
  } catch {
    return ""
  }
}

function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 隐私模式/配额不足：当前会话仍生效，仅不持久化 */
  }
}

function notify(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(NAV_EVENT))
}

/** 读取默认视图；未设置/非法返回 null（由调用方回退到页面默认）。 */
export function getView(): ViewMode | null {
  const v = read(KEYS.view)
  return isValidView(v) ? v : null
}

/** 读取默认排序；未设置/非法返回 null。 */
export function getSort(): SortMode | null {
  const s = read(KEYS.sort)
  return isValidSort(s) ? s : null
}

/** 读取默认 Tab；未设置/非法返回 null。 */
export function getTab(): TabMode | null {
  const t = read(KEYS.tab)
  return isValidTab(t) ? t : null
}

export function setView(view: ViewMode): void {
  write(KEYS.view, view)
  notify()
}

export function setSort(sort: SortMode): void {
  write(KEYS.sort, sort)
  notify()
}

export function setTab(tab: TabMode): void {
  write(KEYS.tab, tab)
  notify()
}

/** 清除浏览偏好（视图/排序/Tab）；不影响主题、侧栏与历史。 */
export function resetPreferences(): void {
  if (typeof window === "undefined") return
  for (const key of PREFERENCE_KEYS) {
    try {
      localStorage.removeItem(key)
    } catch {
      /* noop */
    }
  }
  notify()
}

/** 订阅浏览偏好变更（同页事件 + 跨标签 storage）。 */
export function subscribePreferences(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {}
  const storageHandler = (e: StorageEvent) => {
    if (e.key === null || PREFERENCE_KEYS.includes(e.key)) callback()
  }
  window.addEventListener("storage", storageHandler)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    window.removeEventListener("storage", storageHandler)
    window.removeEventListener(NAV_EVENT, callback)
  }
}
