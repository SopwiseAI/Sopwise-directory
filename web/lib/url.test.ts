import { describe, it, expect, afterEach, vi } from "vitest"
import { getDomain, searchPageHref, writeSearchQuery } from "./url"

describe("getDomain", () => {
  it("extracts hostname from URL", () => {
    expect(getDomain("https://www.example.com")).toBe("example.com")
    expect(getDomain("https://example.com/path/to/page")).toBe("example.com")
  })

  it("strips www prefix", () => {
    expect(getDomain("https://www.google.com")).toBe("google.com")
    expect(getDomain("http://www.github.com/org/repo")).toBe("github.com")
  })

  it("returns empty string for invalid URL", () => {
    expect(getDomain("not-a-url")).toBe("")
    expect(getDomain("")).toBe("")
  })
})

describe("searchPageHref", () => {
  it("带查询词编码进 q", () => {
    expect(searchPageHref("图片生成")).toBe("/search?q=%E5%9B%BE%E7%89%87%E7%94%9F%E6%88%90")
    expect(searchPageHref("ai 写作")).toBe("/search?q=ai%20%E5%86%99%E4%BD%9C")
  })

  it("首尾空白不写进 URL", () => {
    expect(searchPageHref("  claude  ")).toBe("/search?q=claude")
  })

  it("空查询返回裸路径（不带 ?q=）", () => {
    expect(searchPageHref("")).toBe("/search")
    expect(searchPageHref("   ")).toBe("/search")
  })
})

describe("writeSearchQuery", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    window.history.replaceState(null, "", "/")
  })

  it("写入 q 并保留其它查询参数", () => {
    writeSearchQuery("图片生成", "/search", "?tab=featured")
    expect(window.location.pathname).toBe("/search")
    expect(new URLSearchParams(window.location.search).get("q")).toBe("图片生成")
    expect(new URLSearchParams(window.location.search).get("tab")).toBe("featured")
  })

  it("空查询移除 q，其余参数原样保留", () => {
    writeSearchQuery("", "/search", "?q=old&tab=all")
    expect(window.location.search).toBe("?tab=all")
  })

  it("与当前地址一致时跳过写入（避免每次按键都派发 restore）", () => {
    window.history.replaceState(null, "", "/search?q=claude")
    const spy = vi.spyOn(window.history, "replaceState")
    writeSearchQuery("claude", "/search", "?q=claude")
    expect(spy).not.toHaveBeenCalled()
  })

  it("内容变化才写入", () => {
    window.history.replaceState(null, "", "/search?q=old")
    const spy = vi.spyOn(window.history, "replaceState")
    writeSearchQuery("new", "/search", "?q=old")
    expect(spy).toHaveBeenCalledTimes(1)
    expect(window.location.search).toBe("?q=new")
  })
})
