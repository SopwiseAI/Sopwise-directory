"use client"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "theme"
const NAV_EVENT = "theme-change"

function mediaDark(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

function readStoredTheme(): ThemeMode {
  try {
    const t = localStorage.getItem(STORAGE_KEY)
    return t === "light" || t === "dark" || t === "system" ? t : "system"
  } catch {
    return "system"
  }
}

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "system"
  return readStoredTheme()
}

function applyMetaThemeColor(dark: boolean): void {
  const meta = document.querySelector('meta[name="theme-color"]')
  // 与 layout themeScript、globals.css token 保持一致（浅色 #ffffff / 深色 #151517）
  if (meta) meta.setAttribute("content", dark ? "#151517" : "#ffffff")
}

function applyTheme(theme: ThemeMode): void {
  const dark = theme === "dark" || (theme === "system" && mediaDark())
  document.documentElement.classList.toggle("dark", dark)
  // 与 prefsScript 首帧引导同源：data-theme 驱动主题卡片/图标的 CSS 选中态（TH-01）
  document.documentElement.setAttribute("data-theme", theme)
  applyMetaThemeColor(dark)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // 隐私模式/配额不足时忽略持久化失败，当前会话主题仍然生效
  }
}

/** 触发同页主题变更通知（供 useSyncExternalStore 订阅） */
function notify(): void {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(NAV_EVENT))
}

export function subscribeTheme(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  const mediaHandler = () => {
    if (readStoredTheme() === "system") applyMetaThemeColor(media.matches)
    callback()
  }
  media.addEventListener("change", mediaHandler)
  window.addEventListener("storage", storageHandler)
  window.addEventListener(NAV_EVENT, callback)
  return () => {
    media.removeEventListener("change", mediaHandler)
    window.removeEventListener("storage", storageHandler)
    window.removeEventListener(NAV_EVENT, callback)
  }
}

export function setTheme(theme: ThemeMode): void {
  applyTheme(theme)
  notify()
}
