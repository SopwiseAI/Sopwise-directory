import { describe, it, expect, beforeEach, vi } from "vitest"
import { render, act, screen, fireEvent } from "@testing-library/react"
import { ProductBrowser } from "./product-browser"
import type { Product } from "@/lib/types"

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
  useRouter: () => ({ push: () => {}, replace: () => {} }),
  usePathname: () => "/"
}))

function makeProduct(id: string): Product {
  return {
    id,
    name: `Product ${id}`,
    description: "desc",
    url: `https://${id}.example.com`,
    categories: ["test"],
    pricing: "free",
    createdAt: "2024-01-01"
  }
}

const products = [makeProduct("a"), makeProduct("b")]

describe("ProductBrowser a11y ids", () => {
  beforeEach(() => localStorage.clear())

  it("tab 与 tabpanel 的 id/aria 关联正确（单实例）", () => {
    const { container } = render(<ProductBrowser products={products} />)
    const tabs = container.querySelectorAll<HTMLElement>('[role="tab"]')
    const panel = container.querySelector<HTMLElement>('[role="tabpanel"]')
    expect(tabs.length).toBe(3)
    expect(panel).not.toBeNull()
    for (const tab of tabs) {
      expect(tab.getAttribute("aria-controls")).toBe(panel!.id)
    }
    // 有且仅有一个 tab 处于选中态
    const selected = container.querySelectorAll('[role="tab"][aria-selected="true"]')
    expect(selected.length).toBe(1)
  })

  it("同页两个实例的 tabpanel id 不重复（aria 关联不被串扰）", () => {
    const { container } = render(
      <>
        <ProductBrowser products={products} showTabs />
        <ProductBrowser products={products} showTabs />
      </>
    )
    const panels = container.querySelectorAll<HTMLElement>('[role="tabpanel"]')
    expect(panels.length).toBe(2)
    expect(panels[0].id).not.toBe(panels[1].id)
    // 每个实例的 tab 都应指向自己那一侧的 panel
    const allTabs = [...container.querySelectorAll<HTMLElement>('[role="tab"]')]
    expect(allTabs.filter((t) => t.getAttribute("aria-controls") === panels[0].id).length).toBe(3)
    expect(allTabs.filter((t) => t.getAttribute("aria-controls") === panels[1].id).length).toBe(3)
  })
})

describe("ProductBrowser URL sort 同步", () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("latest tab 不应把隐式排序写入 URL（避免污染 sort 状态）", () => {
    window.history.replaceState(null, "", "/?tab=latest")
    render(<ProductBrowser products={products} />)
    expect(new URLSearchParams(window.location.search).get("sort")).toBeNull()
  })

  it("从 latest tab 切到全部后，不应残留 sort=latest", () => {
    window.history.replaceState(null, "", "/?tab=latest")
    render(<ProductBrowser products={products} />)
    act(() => {
      fireEvent.click(screen.getByRole("tab", { name: "全部" }))
    })
    expect(new URLSearchParams(window.location.search).get("sort")).toBeNull()
  })
})

describe("ProductBrowser 无 Tab 页面", () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState(null, "", "/")
  })

  it("showTabs=false 时忽略 URL 的 tab，不静默过滤产品", () => {
    // 产品 b 为精选；?tab=featured 若生效会导致只显示 b
    const withFeatured = [makeProduct("a"), { ...makeProduct("b"), featured: true }]
    window.history.replaceState(null, "", "/?tab=featured")
    render(<ProductBrowser products={withFeatured} showTabs={false} />)
    // 两个产品都应显示（tab 被忽略），且 URL 上的 tab 被清理
    expect(screen.getAllByText(/Product [ab]/).length).toBe(2)
    expect(new URLSearchParams(window.location.search).get("tab")).toBeNull()
  })
})
