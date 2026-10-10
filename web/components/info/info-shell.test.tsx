import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import { InfoLayout, type InfoSectionDef } from "./info-shell"
import { PAGE_WIDTH } from "@/lib/layout"

vi.mock("next/navigation", () => ({
  usePathname: () => "/privacy"
}))

const sections: InfoSectionDef[] = [
  { id: "collect", title: "我们收集什么", body: <p>甲</p> },
  { id: "local-data", title: "保存在你浏览器里的数据", body: <p>乙</p> },
  { id: "cookies", title: "Cookie 与追踪", body: <p>丙</p> }
]

describe("InfoLayout", () => {
  it("按顺序渲染小节，id 唯一，可直接深链", () => {
    const { container } = render(<InfoLayout title="隐私政策" sections={sections} />)
    expect(Array.from(container.querySelectorAll("section[id]")).map((el) => el.id)).toEqual([
      "collect",
      "local-data",
      "cookies"
    ])
    expect(screen.getByRole("heading", { name: "我们收集什么" })).toBeInTheDocument()
    expect(screen.getByText("丙")).toBeInTheDocument()
  })

  it("页面宽度取自统一档位（内容型），不再各页写 max-w-* 字面量", () => {
    const { container } = render(<InfoLayout title="关于 XiGee" sections={sections} />)
    expect(container.firstElementChild).toHaveClass(PAGE_WIDTH.content)
  })

  it("小节在宽容器下切成「标签 + 内容」两列，内容列自行作为容器查询根", () => {
    const { container } = render(<InfoLayout title="服务条款" sections={sections} />)
    const section = container.querySelector("section#collect")
    expect(section).toHaveClass("@4xl:grid")
    expect(section).toHaveClass("@4xl:grid-cols-[13rem_minmax(0,1fr)]")
    expect(screen.getByRole("heading", { name: "我们收集什么" }).parentElement).toBe(section)
    // 控件栅格按内容列宽度决定列数，所以内容列必须是容器
    expect(section?.querySelector("h2 + div")).toHaveClass("@container")
  })

  it("正文列不再包卡片：内容直接落在页面上，避免「卡片套控件」的两层方框", () => {
    const { container } = render(<InfoLayout title="设置" sections={sections} />)
    expect(container.querySelector("section#collect > div")).not.toHaveClass("bg-card")
    expect(container.querySelector("section#collect > div")).not.toHaveClass("border")
  })

  it("保留最后更新日期，并与内容列对齐", () => {
    render(<InfoLayout title="服务条款" sections={sections} updated="2026-10-02" />)
    expect(screen.getByText("最后更新：2026-10-02")).toHaveClass("@4xl:col-start-2")
  })
})
