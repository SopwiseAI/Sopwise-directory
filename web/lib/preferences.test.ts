import { describe, it, expect, beforeEach, vi } from "vitest"
import {
  DEFAULT_SORT,
  DEFAULT_TAB,
  DEFAULT_VIEW,
  getSort,
  getTab,
  getView,
  resetPreferences,
  setSort,
  setTab,
  setView,
  subscribePreferences
} from "./preferences"

beforeEach(() => localStorage.clear())

describe("默认值常量", () => {
  it("与产品页默认一致", () => {
    expect(DEFAULT_VIEW).toBe("grid")
    expect(DEFAULT_SORT).toBe("recommended")
    expect(DEFAULT_TAB).toBe("all")
  })
})

describe("读写与校验", () => {
  it("未设置时返回 null", () => {
    expect(getView()).toBeNull()
    expect(getSort()).toBeNull()
    expect(getTab()).toBeNull()
  })

  it("写入后可读回", () => {
    setView("list")
    setSort("name-asc")
    setTab("featured")
    expect(getView()).toBe("list")
    expect(getSort()).toBe("name-asc")
    expect(getTab()).toBe("featured")
  })

  it("非法存储值返回 null", () => {
    localStorage.setItem("xigee:default-view", "diagonal")
    localStorage.setItem("xigee:default-sort", "random")
    localStorage.setItem("xigee:default-tab", "nope")
    expect(getView()).toBeNull()
    expect(getSort()).toBeNull()
    expect(getTab()).toBeNull()
  })

  it("使用带前缀的存储 key", () => {
    setView("list")
    expect(localStorage.getItem("xigee:default-view")).toBe("list")
  })
})

describe("resetPreferences", () => {
  it("清除三个偏好且不影响其它 key", () => {
    setView("list")
    setSort("name-desc")
    setTab("featured")
    localStorage.setItem("theme", "dark")
    localStorage.setItem("xigee:history", "[]")
    resetPreferences()
    expect(getView()).toBeNull()
    expect(getSort()).toBeNull()
    expect(getTab()).toBeNull()
    expect(localStorage.getItem("theme")).toBe("dark")
    expect(localStorage.getItem("xigee:history")).toBe("[]")
  })
})

describe("subscribePreferences", () => {
  it("写入时触发回调", () => {
    const cb = vi.fn()
    const unsub = subscribePreferences(cb)
    setView("list")
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
  })

  it("退订后不再触发", () => {
    const cb = vi.fn()
    const unsub = subscribePreferences(cb)
    unsub()
    setSort("name-asc")
    expect(cb).not.toHaveBeenCalled()
  })

  it("响应跨标签 storage 事件（相关 key 触发、无关 key 忽略）", () => {
    const cb = vi.fn()
    const unsub = subscribePreferences(cb)
    window.dispatchEvent(new StorageEvent("storage", { key: "xigee:default-view" }))
    expect(cb).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new StorageEvent("storage", { key: "xigee:history" }))
    expect(cb).toHaveBeenCalledTimes(1)
    unsub()
  })
})
