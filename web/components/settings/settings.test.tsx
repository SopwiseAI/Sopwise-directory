import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { BrowsePreferences } from "./browse-preferences"
import { Shortcuts } from "./shortcuts"

describe("Shortcuts", () => {
  it("渲染三条快捷键与按键", () => {
    render(<Shortcuts />)
    expect(screen.getByText("聚焦顶部搜索框")).toBeInTheDocument()
    expect(screen.getByText("在搜索框中执行搜索")).toBeInTheDocument()
    expect(screen.getByText("清空搜索内容 / 关闭搜索框")).toBeInTheDocument()
    expect(screen.getByText("/")).toBeInTheDocument()
    expect(screen.getByText("Esc")).toBeInTheDocument()
  })
})

describe("BrowsePreferences", () => {
  it("未挂载时渲染骨架，不显示可交互选项", () => {
    render(<BrowsePreferences view="grid" sort="latest" tab="all" mounted={false} />)
    expect(screen.queryByLabelText("默认视图")).toBeNull()
    expect(screen.queryByRole("button", { name: "宫格" })).toBeNull()
  })

  it("挂载后显示三组选项", () => {
    render(<BrowsePreferences view="list" sort="name-asc" tab="featured" mounted />)
    expect(screen.getByLabelText("默认视图")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "列表" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "名称 A-Z" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "精选" })).toBeInTheDocument()
  })
})
