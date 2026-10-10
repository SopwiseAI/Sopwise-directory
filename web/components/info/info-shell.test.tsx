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
    expect(container.querySelector(`.${CSS.escape(PAGE_WIDTH.content)}`)).not.toBeNull()
  })

  it("页面导航放进二级栏：下边框随内容宽度 + 桌面吸顶 + 上下保留留白", () => {
    const { container } = render(<InfoLayout title="隐私政策" sections={sections} />)
    const bar = container.firstElementChild as HTMLElement
    // 外层只管底色通栏（吸顶时不漏内容），不画边框
    expect(bar).not.toHaveClass("border-b")
    expect(bar).toHaveClass("md:sticky")
    // 不再抵消外壳上内边距：栏与顶栏之间保留留白（观感比贴顶更松弛）
    expect(bar).not.toHaveClass("-mt-6")
    expect(bar).toHaveClass("mb-6")
    // 导航在栏内
    expect(bar.querySelector('nav[aria-label="信息导航"]')).not.toBeNull()
    // 边框画在「与正文同宽」的内层容器上，否则信息页的下划线会比正文两边各多出 40px
    const barInner = bar.firstElementChild as HTMLElement
    expect(barInner).toHaveClass("border-b")
    expect(barInner).toHaveClass(PAGE_WIDTH.content)
    // 正文容器与二级栏同宽（内容型）
    const content = bar.nextElementSibling as HTMLElement
    expect(content).toHaveClass(PAGE_WIDTH.content)
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
