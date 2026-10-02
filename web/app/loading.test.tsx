import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import Loading from "./loading"

describe("Loading", () => {
  it("以 status 角色暴露加载状态并带屏幕阅读器文案", () => {
    render(<Loading />)
    const status = screen.getByRole("status")
    expect(status).toHaveAttribute("aria-busy", "true")
    expect(status).toHaveTextContent("正在加载…")
  })
})
