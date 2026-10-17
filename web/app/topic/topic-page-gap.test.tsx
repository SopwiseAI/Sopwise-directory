import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import TopicPage, { generateMetadata, generateStaticParams } from "./[id]/page"
import { getAllTopics } from "@/lib/data"

/**
 * 回归守卫：`/topic/[id]` 路由页。
 *
 * 这个测试**文件名与所在目录本身**就是断言的一部分 —— 路由必须叫 `app/topic/[id]`，
 * 搬回 `app/category/[id]` 会让这里的 import 直接解析失败。
 */
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND")
  },
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/topic/chat-assistant",
}))

describe("/topic/[id] 路由页", () => {
  it("generateStaticParams 覆盖全部主题", async () => {
    const params = await generateStaticParams()
    expect(params.map((p) => p.id)).toEqual(getAllTopics().map((t) => t.id))
  })

  it("canonical 指向 /topic/<id>", async () => {
    const topic = getAllTopics()[0]
    const meta = await generateMetadata({ params: Promise.resolve({ id: topic.id }) })
    expect(meta.alternates?.canonical).toBe(`/topic/${topic.id}`)
  })

  it("渲染主题名（h1）与 emoji 图标，不泄漏旧 Lucide 名", async () => {
    const topic = getAllTopics()[0]
    render(await TopicPage({ params: Promise.resolve({ id: topic.id }) }))

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(topic.name)
    expect(screen.getAllByText(topic.icon).length).toBeGreaterThan(0)
    expect(screen.queryByText("Box")).toBeNull()
    expect(screen.queryByText("MessageSquare")).toBeNull()
  })

  it("未知主题 id 触发 notFound()", async () => {
    await expect(TopicPage({ params: Promise.resolve({ id: "no-such-topic" }) })).rejects.toThrow("NEXT_NOT_FOUND")
  })
})
