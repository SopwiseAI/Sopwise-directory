"use client"

export type ThemeMode = "light" | "dark" | "system"

function mediaDark(): boolean {
  if (typeof window === "undefined") return false
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function getTheme(): ThemeMode {
  if (typeof window === "undefined") return "system"
  const t = localStorage.getItem("theme")
  return t === "light" || t === "dark" || t === "system" ? t : "system"
}

function applyMetaThemeColor(dark: boolean): void {
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", dark ? "#0f1114" : "#fafafb")
}

function applyTheme(theme: ThemeMode): void {
  const dark = theme === "dark" || (theme === "system" && mediaDark())
  document.documentElement.classList.toggle("dark", dark)
  applyMetaThemeColor(dark)
  localStorage.setItem("theme", theme)
}

export function subscribeTheme(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const handler = (e: StorageEvent) => {
    if (e.key === "theme") callback()
  }
  const mediaHandler = () => {
    const t = localStorage.getItem("theme")
    if (t === "system") applyMetaThemeColor(media.matches)
    callback()
  }
  media.addEventListener("change", mediaHandler)
  window.addEventListener("storage", handler)
  return () => {
    media.removeEventListener("change", mediaHandler)
    window.removeEventListener("storage", handler)
  }
}

export function setTheme(theme: ThemeMode): void {
  applyTheme(theme)
  window.dispatchEvent(new StorageEvent("storage", { key: "theme" }))
}
