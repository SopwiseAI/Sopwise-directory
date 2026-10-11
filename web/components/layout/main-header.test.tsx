import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, fireEvent, act } from "@testing-library/react"
import { MainHeader } from "./main-header"
import { suggestionOptionId } from "@/components/search/search-suggestions"
import { mockCategories, mockSuggestionDocs } from "@/.storybook/fixtures"

/** next/navigation 的可变替身：用例间切换 pathname / search。 */
const nav = vi.hoisted(() => ({
  push: vi.fn(),
  prefetch: vi.fn(),
  pathname: "/",
  search: ""
}))

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: nav.push, prefetch: nav.prefetch, replace: vi.fn() }),
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search)
}))

const DEBOUNCE_MS = 150

function renderHeader() {
  return render(<MainHeader categories={mockCategories} suggestions={mockSuggestionDocs} />)
}

function typeInto(value: string) {
  const input = screen.getByRole("combobox", { name: "搜索 AI 工具" }) as HTMLInputElement
  // 真实 focus：QuerySync 靠 document.activeElement 判断「用户正在打字」，只发事件不够
  act(() => {
    input.focus()
  })
  fireEvent.change(input, { target: { value } })
  return input
}

describe("MainHeader 搜索", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    nav.pathname = "/"
    nav.search = ""
    window.history.replaceState(null, "", "/")
  })

  afterEach(() => {
    vi.useRealTimers()
    window.history.replaceState(null, "", "/")
  })

  it("表单 action/method 与 input name：hydration 完成前回车走原生 GET 提交", () => {
    renderHeader()
    const form = screen.getByRole("search")
    expect(form).toHaveAttribute("action", "/search")
    expect(form).toHaveAttribute("method", "get")
    expect(screen.getByRole("combobox", { name: "搜索 AI 工具" })).toHaveAttribute("name", "q")
  })

  it("搜索页内边打边搜：原地写 URL，全程不发起客户端导航（旧版每次换词都要跑一趟服务器）", () => {
    vi.useFakeTimers()
    nav.pathname = "/search"
    window.history.replaceState(null, "", "/search")
    renderHeader()

    const input = typeInto("claude")
    expect(input).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(DEBOUNCE_MS + 50)
    })

    expect(window.location.pathname).toBe("/search")
    expect(new URLSearchParams(window.location.search).get("q")).toBe("claude")
    expect(nav.push).not.toHaveBeenCalled()
  })

  it("回车立即定格 URL，不必等防抖", () => {
    vi.useFakeTimers()
    nav.pathname = "/search"
    window.history.replaceState(null, "", "/search")
    renderHeader()

    typeInto("图片生成")
    fireEvent.submit(screen.getByRole("search"))

    expect(new URLSearchParams(window.location.search).get("q")).toBe("图片生成")
    expect(nav.push).not.toHaveBeenCalled()
  })

  it("其它页面回车才做一次客户端跳转，并预取 /search", () => {
    renderHeader()

    typeInto("claude")
    fireEvent.submit(screen.getByRole("search"))

    expect(nav.push).toHaveBeenCalledWith("/search?q=claude")
    expect(nav.prefetch).toHaveBeenCalledWith("/search")
    // 非搜索页不改当前地址栏
    expect(window.location.search).toBe("")
  })

  it("其它页输入即时出建议（不吃防抖），↑↓ 即可选中", () => {
    vi.useFakeTimers()
    renderHeader()

    const input = typeInto("chat")
    // 刻意不推进计时器：建议必须是即时的，不能等 150ms
    const listbox = screen.getByRole("listbox", { name: "搜索建议" })
    expect(listbox).toBeInTheDocument()
    expect(input).toHaveAttribute("aria-expanded", "true")

    fireEvent.keyDown(input, { key: "ArrowDown" })
    expect(input).toHaveAttribute("aria-activedescendant", suggestionOptionId("search-suggestions", 0))
    expect(document.getElementById(suggestionOptionId("search-suggestions", 0))).toHaveAttribute(
      "aria-selected",
      "true"
    )

    // 从第一条再往上 = 回绕到最后一条（不是回到「未选中」）
    const count = screen.getAllByRole("option").length
    fireEvent.keyDown(input, { key: "ArrowUp" })
    expect(input).toHaveAttribute("aria-activedescendant", suggestionOptionId("search-suggestions", count - 1))
  })

  it("搜索页不弹建议下拉（结果页下方已经实时出结果，两份列表是重复的）", () => {
    vi.useFakeTimers()
    nav.pathname = "/search"
    window.history.replaceState(null, "", "/search")
    renderHeader()

    typeInto("chat")
    expect(screen.queryByRole("listbox")).toBeNull()
  })

  it("Esc 先收下拉并保留已输入内容，再按一次才清空", () => {
    vi.useFakeTimers()
    renderHeader()

    const input = typeInto("chat") as HTMLInputElement
    expect(screen.getByRole("listbox")).toBeInTheDocument()

    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByRole("listbox")).toBeNull()
    expect(input.value).toBe("chat")

    fireEvent.keyDown(input, { key: "Escape" })
    expect(input.value).toBe("")
  })
})
