import { describe, it, expect } from "vitest"
import { render, screen, within } from "@testing-library/react"
import { SearchSuggestions, suggestionOptionId } from "./search-suggestions"
import type { SuggestionDoc } from "@/lib/search"

const docs: SuggestionDoc[] = [
  {
    id: "chatgpt",
    name: "ChatGPT",
    url: "https://chat.openai.com",
    categories: ["chat-assistant"],
    categoryNames: ["对话助手"],
    tags: ["对话"],
    pricing: "freemium"
  },
  {
    id: "midjourney",
    name: "Midjourney",
    url: "https://www.midjourney.com",
    categories: ["image-generation"],
    categoryNames: ["图像生成"],
    tags: ["图像"],
    pricing: "paid"
  }
]

describe("SearchSuggestions", () => {
  it("渲染每条建议：名称 + 分类 + 域名，并带上历史埋点属性", () => {
    render(<SearchSuggestions items={docs} query="chat" activeIndex={-1} listboxId="lb" />)

    const options = within(screen.getByRole("listbox", { name: "搜索建议" })).getAllByRole("option")
    expect(options).toHaveLength(2)
    expect(screen.getByText("对话助手")).toBeInTheDocument()
    expect(screen.getByText("图像生成")).toBeInTheDocument()
    expect(screen.getByText("chat.openai.com")).toBeInTheDocument()
    expect(screen.getByText("Midjourney").closest("a")).toHaveAttribute("data-history-id", "midjourney")
  })

  it("命中片段用 <mark> 高亮，与结果页同一套分段规则", () => {
    const { container } = render(<SearchSuggestions items={docs} query="chat" activeIndex={-1} listboxId="lb" />)
    const marks = container.querySelectorAll("mark")
    expect(marks).toHaveLength(1)
    expect(marks[0].textContent).toBe("Chat")
  })

  it("activeIndex 指向的选项 aria-selected=true，其余为 false", () => {
    render(<SearchSuggestions items={docs} query="chat" activeIndex={1} listboxId="lb" />)
    const options = screen.getAllByRole("option")
    expect(options[0]).toHaveAttribute("aria-selected", "false")
    expect(options[1]).toHaveAttribute("aria-selected", "true")
    expect(options[1]).toHaveAttribute("id", suggestionOptionId("lb", 1))
  })

  it("未选中时提示「查看全部结果」，选中后变为「打开」", () => {
    const { rerender } = render(<SearchSuggestions items={docs} query="chat" activeIndex={-1} listboxId="lb" />)
    expect(screen.getByText("查看全部结果")).toBeInTheDocument()
    rerender(<SearchSuggestions items={docs} query="chat" activeIndex={0} listboxId="lb" />)
    expect(screen.getByText("打开")).toBeInTheDocument()
  })

  it("无建议时不渲染任何弹层（不占 DOM、不遮内容）", () => {
    const { container } = render(<SearchSuggestions items={[]} query="zzz" activeIndex={-1} listboxId="lb" />)
    expect(container.firstChild).toBeNull()
  })
})
