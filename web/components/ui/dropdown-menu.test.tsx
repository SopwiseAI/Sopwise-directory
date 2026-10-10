import { describe, it, expect } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger
} from "./dropdown-menu"

/**
 * 回归防线：base-ui 的 `Menu.RadioItem` 默认 `closeOnClick = false`（普通 `Menu.Item` 是 `true`），
 * 照注册表原样用会出现「选了排序项、菜单不关」。包装层已把默认改成 true，这里用真实交互锁住它。
 */
function renderMenu() {
  return render(
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger>排序</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup defaultValue="recommended">
          <DropdownMenuRadioItem value="recommended">综合</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-asc">名称 A-Z</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

describe("DropdownMenuRadioItem 选中后关闭菜单", () => {
  it("点击某一项后，菜单项从文档中消失（closeOnClick 默认 true）", () => {
    renderMenu()
    const item = screen.getByRole("menuitemradio", { name: "名称 A-Z" })
    expect(item).toBeInTheDocument()

    fireEvent.click(item)

    expect(screen.queryByRole("menuitemradio", { name: "名称 A-Z" })).not.toBeInTheDocument()
  })

  it("调用处显式传 closeOnClick={false} 时保持打开（保留 base-ui 能力）", () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>排序</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup defaultValue="a">
            <DropdownMenuRadioItem value="a" closeOnClick={false}>
              A
            </DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="b" closeOnClick={false}>
              B
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    )
    const item = screen.getByRole("menuitemradio", { name: "B" })
    fireEvent.click(item)
    expect(screen.getByRole("menuitemradio", { name: "B" })).toBeInTheDocument()
  })
})
