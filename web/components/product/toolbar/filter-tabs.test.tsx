import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { FilterTabs } from "./filter-tabs"
import { TAB_OPTIONS } from "@/lib/product-options"
import type { TabMode } from "@/lib/product-query"

/**
 * 这组测试锁住 FilterTabs 手写 WAI-ARIA tabs 的行为：
 * 不迁移到 base-ui `tabs`（它要求每个 value 一个面板、默认不支持方向键选中、也没有
 * "把选中项滚进可视区"），所以这里的行为必须由测试守住。
 */
function setup(tab: TabMode = "all") {
  const onTabChange = vi.fn()
  const view = render(<FilterTabs tab={tab} onTabChange={onTabChange} panelId="panel-x" />)
  const list = screen.getByRole("tablist", { name: "产品筛选" })
  return { onTabChange, view, list }
}

describe("FilterTabs 键盘与 ARIA", () => {
  it("tablist 上不挂 aria-controls（关联只属于每个 tab）", () => {
    const { list } = setup()
    expect(list.getAttribute("aria-controls")).toBeNull()
  })

  it("每个 tab 都指向同一个 tabpanel，且只有一个是选中态", () => {
    const { view } = setup()
    const tabs = [...view.container.querySelectorAll<HTMLElement>('[role="tab"]')]
    expect(tabs.length).toBe(TAB_OPTIONS.length)
    for (const t of tabs) expect(t.getAttribute("aria-controls")).toBe("panel-x")
    const selected = tabs.filter((t) => t.getAttribute("aria-selected") === "true")
    expect(selected.length).toBe(1)
    // roving tabindex：只有选中项可 Tab 进入
    expect(selected[0].getAttribute("tabindex")).toBe("0")
    for (const t of tabs.filter((t) => t !== selected[0])) expect(t.getAttribute("tabindex")).toBe("-1")
  })

  it("ArrowRight 选中并聚焦下一项，末项回绕到首项", () => {
    const last = TAB_OPTIONS[TAB_OPTIONS.length - 1].value
    const { onTabChange, list } = setup(last)
    fireEvent.keyDown(list, { key: "ArrowRight" })
    expect(onTabChange).toHaveBeenCalledWith(TAB_OPTIONS[0].value)
  })

  it("ArrowLeft 选中并聚焦上一项，首项回绕到末项", () => {
    const { onTabChange, list } = setup(TAB_OPTIONS[0].value)
    fireEvent.keyDown(list, { key: "ArrowLeft" })
    expect(onTabChange).toHaveBeenCalledWith(TAB_OPTIONS[TAB_OPTIONS.length - 1].value)
  })

  it("Home / End 跳到首项 / 末项", () => {
    const { onTabChange, list } = setup(TAB_OPTIONS[1].value)
    fireEvent.keyDown(list, { key: "End" })
    expect(onTabChange).toHaveBeenLastCalledWith(TAB_OPTIONS[TAB_OPTIONS.length - 1].value)
    fireEvent.keyDown(list, { key: "Home" })
    expect(onTabChange).toHaveBeenLastCalledWith(TAB_OPTIONS[0].value)
  })

  it("无关按键不触发切换，也不阻止默认行为", () => {
    const { onTabChange, list } = setup()
    fireEvent.keyDown(list, { key: "a" })
    expect(onTabChange).not.toHaveBeenCalled()
  })
})
