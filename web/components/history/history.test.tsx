import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { useHistoryCount } from "./history-count"
import { HistoryList } from "./history-list"
import { addToHistory } from "@/lib/history"
import type { Tool } from "@/lib/types"

const mockTool: Tool = {
  id: "test-1",
  name: "Test Tool",
  description: "A test tool",
  url: "https://test.com",
  topics: ["test-cat"],
  pricing: "free",
  createdAt: "2024-01-01",
}

function CountProbe() {
  return <span data-testid="count">{useHistoryCount()}</span>
}

describe("useHistoryCount", () => {
  beforeEach(() => localStorage.clear())

  it("空历史时计数为 0（与其它计数一致，始终显示数字）", () => {
    render(<CountProbe />)
    expect(screen.getByTestId("count")).toHaveTextContent("0")
  })

  it("从版本化信封快照解析出条数（回归：信封非裸数组）", () => {
    addToHistory(mockTool)
    render(<CountProbe />)
    expect(screen.getByTestId("count")).toHaveTextContent("1")
  })
})

describe("HistoryList", () => {
  beforeEach(() => localStorage.clear())

  it("空历史时显示空状态", () => {
    render(<HistoryList topics={[]} />)
    expect(screen.getByText("暂无访问记录")).toBeInTheDocument()
  })

  it("从版本化信封快照渲染条目（回归：信封非裸数组）", () => {
    addToHistory(mockTool)
    render(<HistoryList topics={[]} />)
    expect(screen.getByText("Test Tool")).toBeInTheDocument()
    expect(screen.getByText("test.com")).toBeInTheDocument()
  })

  it("历史条目携带 data-history-* 属性（供回访时回写）", () => {
    addToHistory(mockTool)
    const { container } = render(<HistoryList topics={[]} />)
    expect(container.querySelector('a[data-history-id="test-1"]')).not.toBeNull()
  })

  it("主题已被删除时不渲染悬空分隔符", () => {
    addToHistory(mockTool)
    const { container } = render(<HistoryList topics={[]} />)
    const link = container.querySelector('a[data-history-id="test-1"]') as HTMLElement
    const meta = link.querySelector("p.font-data")?.textContent ?? ""
    expect(meta.startsWith("test.com")).toBe(true)
    expect(meta).not.toContain("· ·")
  })
})
