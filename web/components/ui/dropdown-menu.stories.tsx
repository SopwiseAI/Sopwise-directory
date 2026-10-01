import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuRadioItemIndicator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/DropdownMenu",
  component: DropdownMenu,
  tags: ["autodocs"]
} satisfies Meta<typeof DropdownMenu>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>打开菜单</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>编辑</DropdownMenuItem>
        <DropdownMenuItem>复制</DropdownMenuItem>
        <DropdownMenuItem disabled>删除（禁用）</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const WithRadioGroup: Story = {
  render: () => (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>排序方式</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup defaultValue="latest">
          <DropdownMenuRadioItem value="latest" closeOnClick>
            <span>最新</span>
            <DropdownMenuRadioItemIndicator />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-asc" closeOnClick>
            <span>名称 A-Z</span>
            <DropdownMenuRadioItemIndicator />
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="name-desc" closeOnClick>
            <span>名称 Z-A</span>
            <DropdownMenuRadioItemIndicator />
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
