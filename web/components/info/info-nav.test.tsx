import { vi, describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { InfoNav } from "./info-nav"

vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy"
}))

describe("InfoNav", () => {
  it("渲染四项信息导航并标记当前页", () => {
    render(<InfoNav />)
    const nav = screen.getByRole("navigation", { name: "信息导航" })
    expect(nav).toBeInTheDocument()
    for (const label of ["设置", "关于", "隐私政策", "服务条款"]) {
      expect(screen.getByRole("link", { name: new RegExp(label) })).toHaveAttribute(
        "href",
        expect.stringMatching(/^\/(settings|about|privacy|terms)$/)
      )
    }
    const current = screen.getByRole("link", { name: /隐私政策/ })
    expect(current).toHaveAttribute("aria-current", "page")
  })
})
