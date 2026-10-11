import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { Highlighted } from "./highlight"

describe("Highlighted", () => {
  it("命中片段包在 <mark> 里，未命中部分保持原样", () => {
    const { container } = render(<Highlighted text="图像生成" query="图像" />)
    expect(container.querySelector("mark")?.textContent).toBe("图像")
    expect(container.textContent).toBe("图像生成")
  })

  it("em 变体必须显式清掉 <mark> 的浏览器默认黄底", () => {
    const { container } = render(<Highlighted text="图像生成" query="图像" variant="em" />)
    expect(container.querySelector("mark")?.className).toContain("bg-transparent")
  })

  it("tint 变体不加 padding / 圆角：那会把中文文本撑出参差的空隙", () => {
    const { container } = render(<Highlighted text="图像生成" query="图像" variant="tint" />)
    const className = container.querySelector("mark")?.className ?? ""
    expect(className).not.toMatch(/(^|\s)px-/)
    expect(className).not.toMatch(/(^|\s)rounded/)
  })

  it("没有命中时不高亮任何片段", () => {
    const { container } = render(<Highlighted text="图像生成" query="zzz" />)
    expect(container.querySelector("mark")).toBeNull()
  })
})
