import { describe, it, expect, beforeEach, vi } from "vitest"
import { render } from "@testing-library/react"
import { Sidebar } from "./sidebar"
import { mockTopics } from "@/.storybook/fixtures"

/**
 * 回归守卫：侧栏是桌面端唯一的主题入口。
 *
 * - I1：主题链接必须是 `/topic/<id>`（旧 `/category/` 是有意 404 的）。
 * - I2：折叠态靠后代选择器 `[&_svg]:size-5` 把图标顶到 20px，emoji 是 `<span>` 命中不了 ——
 *   所以折叠态必须显式给字号，否则「全部工具」20px / 主题 emoji 16px 会明显不齐。
 */
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}))

const topicCounts = Object.fromEntries(mockTopics.map((t) => [t.id, 3]))

/** 取某个主题链接里的 emoji 节点（跳过活跃指示条等其它 aria-hidden 的 span）。 */
function emojiIn(container: HTMLElement, href: string): HTMLElement | null {
  const link = container.querySelector(`a[href="${href}"]`)
  if (!link) return null
  return (
    Array.from(link.querySelectorAll<HTMLElement>("span")).find((s) =>
      /\p{Extended_Pictographic}/u.test(s.textContent ?? ""),
    ) ?? null
  )
}

describe("Sidebar", () => {
  beforeEach(() => localStorage.clear())

  it("主题链接指向 /topic/<id>，不含 /category/", () => {
    const { container } = render(<Sidebar topics={mockTopics} topicCounts={topicCounts} totalTools={85} />)
    const hrefs = Array.from(container.querySelectorAll('a[href^="/topic/"]')).map((a) => a.getAttribute("href"))
    expect(hrefs).toContain("/topic/chat-assistant")
    expect(hrefs).toContain("/topic/code-tools")
    expect(container.querySelector('a[href^="/category/"]')).toBeNull()
  })

  it("展开态：emoji 用 text-base、不用 size-*", () => {
    const { container } = render(<Sidebar topics={mockTopics} topicCounts={topicCounts} totalTools={85} />)
    const emoji = emojiIn(container, "/topic/chat-assistant")
    expect(emoji).not.toBeNull()
    expect(emoji?.className).toContain("text-base")
    expect(emoji?.className).not.toContain("size-")
  })

  it("折叠态：emoji 放大到 text-xl，与 Lucide 的 size-5 视觉对齐", () => {
    localStorage.setItem("xigee:sidebar-collapsed", "true")
    const { container } = render(<Sidebar topics={mockTopics} topicCounts={topicCounts} totalTools={85} />)
    const emoji = emojiIn(container, "/topic/chat-assistant")
    expect(emoji).not.toBeNull()
    expect(emoji?.className).toContain("text-xl")
    expect(emoji?.className).not.toContain("size-")
  })
})
