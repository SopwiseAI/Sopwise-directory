import { describe, it, expect } from "vitest"
import { PAGE_WIDTH, pageShell } from "./layout"

describe("页面宽度档位", () => {
  it("浏览型与首页外壳/页脚同级，内容型比它小一档", () => {
    expect(PAGE_WIDTH.browse).toBe("max-w-7xl")
    expect(PAGE_WIDTH.content).toBe("max-w-6xl")
    expect(PAGE_WIDTH.browse).not.toBe(PAGE_WIDTH.content)
  })

  it("pageShell 默认内容型，且始终居中限宽", () => {
    expect(pageShell()).toBe("mx-auto w-full max-w-6xl")
    expect(pageShell("browse", "space-y-4")).toBe("mx-auto w-full max-w-7xl space-y-4")
  })
})
