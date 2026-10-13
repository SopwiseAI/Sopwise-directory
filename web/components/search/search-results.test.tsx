import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SearchResults } from "./search-results"
import { mockCategories, mockCategoryCounts, mockProducts } from "@/.storybook/fixtures"
import { addRecentSearch } from "@/lib/recent-searches"

/** next/navigation 的可变替身：用例间切换 pathname / search。 */
const nav = vi.hoisted(() => ({ pathname: "/search", search: "" }))

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => new URLSearchParams(nav.search),
}))

const featured = mockProducts.filter((p) => p.featured)

function renderResults() {
  return render(
    <SearchResults
      products={mockProducts}
      featured={featured}
      categories={mockCategories}
      categoryCounts={mockCategoryCounts}
    />,
  )
}

describe("SearchResults", () => {
  beforeEach(() => {
    localStorage.clear()
    nav.pathname = "/search"
    nav.search = ""
    window.history.replaceState(null, "", "/search")
  })

  it("空查询走着陆态：给最近搜索/试试这些/分类出口，而不是一片空白", () => {
    renderResults()
    expect(screen.getByText("试试这些")).toBeInTheDocument()
    expect(screen.getByText("按分类浏览")).toBeInTheDocument()
    expect(screen.queryByText("最近搜索")).toBeNull()
    expect(document.querySelector("[data-search-result]")).toBeNull()
  })

  it("有最近搜索时在着陆态置顶展示（localStorage 只在客户端可得）", () => {
    addRecentSearch("图像生成")
    renderResults()
    expect(screen.getByText("最近搜索")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "图像生成" })).toBeInTheDocument()
  })

  it("有结果时给出结果计数、排序入口与结果行", () => {
    nav.search = "?q=对话"
    renderResults()

    expect(screen.getByRole("status")).toHaveTextContent("找到 2 个与「对话」相关的结果")
    expect(screen.getByRole("button", { name: "排序" })).toBeInTheDocument()
    expect(document.querySelectorAll("[data-search-result]")).toHaveLength(2)
  })

  it("切换排序原地写 URL（replaceState，不发导航）", () => {
    nav.search = "?q=对话"
    renderResults()

    fireEvent.click(screen.getByRole("button", { name: "排序" }))
    fireEvent.click(screen.getByRole("menuitemradio", { name: /最新/ }))
    expect(new URLSearchParams(window.location.search).get("sort")).toBe("latest")
  })

  it("未找到时走无结果页，并给出「也许你想找」/ 换词建议", () => {
    nav.search = "?q=zzzznotfound"
    renderResults()

    expect(screen.getByText(/未找到与/)).toBeInTheDocument()
    expect(screen.getByText("换个词试试：")).toBeInTheDocument()
    expect(document.querySelector("[data-search-result]")).toBeNull()
  })

  it("结果行带命中上下文（描述片段里能看到关键词）", () => {
    nav.search = "?q=代码"
    renderResults()

    const row = document.querySelector("[data-search-result]")
    expect(row?.textContent).toContain("代码")
    expect(row?.querySelector("mark")).not.toBeNull()
  })
})
