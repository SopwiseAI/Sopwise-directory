import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { subscribeTheme, setTheme, getTheme } from "./theme"

/** 可控的 matchMedia：能改 matches 并派发 change，用于模拟系统深浅色切换。 */
function installMatchMedia(initialDark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()
  const mql = {
    matches: initialDark,
    media: "(prefers-color-scheme: dark)",
    onchange: null,
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
    addListener: (cb: (e: { matches: boolean }) => void) => listeners.add(cb),
    removeListener: (cb: (e: { matches: boolean }) => void) => listeners.delete(cb),
    dispatchEvent: () => false
  }
  const spy = vi.fn(() => mql)
  vi.stubGlobal("matchMedia", spy)
  return {
    mql,
    setDark(dark: boolean) {
      mql.matches = dark
      listeners.forEach((cb) => cb({ matches: dark }))
    }
  }
}

describe("subscribeTheme 系统主题", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    document.documentElement.removeAttribute("data-theme")
    const meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    document.head.appendChild(meta)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    document.querySelector('meta[name="theme-color"]')?.remove()
  })

  it("系统模式：OS 切换到深色时应加上 .dark 类并同步 data-theme", () => {
    const media = installMatchMedia(false)
    localStorage.setItem("theme", "system")
    const unsubscribe = subscribeTheme(() => {})
    media.setDark(true)
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.getAttribute("data-theme")).toBe("system")
    unsubscribe()
  })

  it("系统模式：OS 切换到浅色时应移除 .dark 类", () => {
    const media = installMatchMedia(true)
    localStorage.setItem("theme", "system")
    const unsubscribe = subscribeTheme(() => {})
    document.documentElement.classList.add("dark")
    media.setDark(false)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    unsubscribe()
  })

  it("显式 light/dark 模式：OS 切换不应改变 .dark 类", () => {
    const media = installMatchMedia(false)
    localStorage.setItem("theme", "light")
    const unsubscribe = subscribeTheme(() => {})
    media.setDark(true)
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    unsubscribe()
  })
})

describe("getTheme", () => {
  beforeEach(() => localStorage.clear())
  it("默认 system，非法值回退 system", () => {
    expect(getTheme()).toBe("system")
    localStorage.setItem("theme", "dark")
    expect(getTheme()).toBe("dark")
    localStorage.setItem("theme", "bogus")
    expect(getTheme()).toBe("system")
  })
})

describe("setTheme", () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.className = ""
    const meta = document.createElement("meta")
    meta.setAttribute("name", "theme-color")
    document.head.appendChild(meta)
  })
  afterEach(() => document.querySelector('meta[name="theme-color"]')?.remove())

  it("设置 dark 时加 .dark 并写 localStorage", () => {
    installMatchMedia(false)
    setTheme("dark")
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(localStorage.getItem("theme")).toBe("dark")
  })
})
