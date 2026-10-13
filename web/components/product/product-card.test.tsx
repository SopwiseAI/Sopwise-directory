import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { ProductCard } from "./product-card"
import type { Product } from "@/lib/types"

const product: Product = {
  id: "chatgpt",
  name: "ChatGPT",
  description: "OpenAI 推出的智能对话助手。",
  url: "https://chat.openai.com",
  categories: ["chat-assistant"],
  tags: ["对话", "通用"],
  pricing: "freemium",
  createdAt: "2022-11-30"
}

describe("ProductCard", () => {
  it("标题链接指向站内详情页", () => {
    render(<ProductCard product={product} categoryLabel="对话助手" />)
    const heading = screen.getByRole("heading", { level: 2 })
    expect(within(heading).getByRole("link")).toHaveAttribute("href", "/tool/chatgpt")
  })

  it("官网是独立的出站链接（新标签页 + noopener）", () => {
    render(<ProductCard product={product} />)
    const external = screen.getByRole("link", { name: /打开 ChatGPT 官网/ })
    expect(external).toHaveAttribute("href", "https://chat.openai.com")
    expect(external).toHaveAttribute("target", "_blank")
    expect(external).toHaveAttribute("rel", expect.stringContaining("noopener"))
  })

  it("不产生嵌套 <a>（非法 HTML，会让内层链接失效）", () => {
    const { container } = render(<ProductCard product={product} />)
    expect(container.querySelectorAll("a a")).toHaveLength(0)
  })

  it("官网链接带 data-history-*，供历史记录回写", () => {
    render(<ProductCard product={product} />)
    const external = screen.getByRole("link", { name: /打开 ChatGPT 官网/ })
    expect(external).toHaveAttribute("data-history-id", "chatgpt")
    expect(external).toHaveAttribute("data-history-url", "https://chat.openai.com")
  })

  it("标题的 truncate 在内层 span 上：overflow:hidden 挂在链接上会把铺满热区裁掉", () => {
    const { container } = render(<ProductCard product={product} />)
    const link = container.querySelector('a[href="/tool/chatgpt"]')
    expect(link).not.toBeNull()
    expect(link?.className).not.toContain("truncate")
    expect(link?.querySelector("span")?.className).toContain("truncate")
  })

  it("卡片外壳不是链接（点击面由标题的 stretched link 提供）", () => {
    const { container } = render(<ProductCard product={product} />)
    const shell = container.querySelector("[data-product-card]")
    expect(shell?.tagName).toBe("ARTICLE")
  })
})
