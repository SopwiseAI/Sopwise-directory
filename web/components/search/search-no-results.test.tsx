import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { SearchNoResults } from "./search-no-results"
import { mockCategories, mockCategoryCounts, mockProducts } from "@/.storybook/fixtures"
import { buildSearchDocs } from "@/lib/search"

const categoryNames = Object.fromEntries(mockCategories.map((c) => [c.id, c.name]))
const docs = buildSearchDocs(mockProducts, categoryNames)
const featured = mockProducts.filter((p) => p.featured)

function renderNoResults(props: Partial<React.ComponentProps<typeof SearchNoResults>> = {}) {
  const onPick = vi.fn()
  render(
    <SearchNoResults
      query="zzz"
      fallback={[]}
      featured={featured}
      suggestions={["ChatGPT", "Claude"]}
      categories={mockCategories}
      categoryCounts={mockCategoryCounts}
      categoryNames={categoryNames}
      onPick={onPick}
      {...props}
    />,
  )
  return { onPick }
}

describe("SearchNoResults", () => {
  it("先明确说没找到，并说明「能搜什么」", () => {
    renderNoResults()
    expect(screen.getByText(/未找到与/)).toBeInTheDocument()
    expect(screen.getByText("「zzz」")).toBeInTheDocument()
    expect(screen.getByText(/可以搜工具名称、描述、标签或分类/)).toBeInTheDocument()
  })

  it("有点击即搜的换词建议", () => {
    const { onPick } = renderNoResults()
    fireEvent.click(screen.getByRole("button", { name: "Claude" }))
    expect(onPick).toHaveBeenCalledWith("Claude")
  })

  it("有「也许相关」时把它作为主推荐，并隐藏精选推荐", () => {
    renderNoResults({ fallback: docs.slice(0, 2) })
    expect(screen.getByText("也许你想找")).toBeInTheDocument()
    expect(screen.queryByText("精选推荐")).toBeNull()
    const rows = document.querySelectorAll("[data-search-result]")
    expect(rows).toHaveLength(2)
    expect(rows[0].textContent).toContain("ChatGPT")
  })

  it("没有「也许相关」时退回精选推荐，用户不会无处可去", () => {
    renderNoResults({ fallback: [] })
    expect(screen.queryByText("也许你想找")).toBeNull()
    expect(screen.getByText("精选推荐")).toBeInTheDocument()
  })

  it("始终给出按分类浏览的出口", () => {
    renderNoResults()
    expect(screen.getByText("按分类浏览")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /对话助手/ })).toHaveAttribute("href", "/category/chat-assistant")
  })
})
