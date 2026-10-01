import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SortMenu } from "@/components/product/toolbar/sort-menu"
import type { SortMode } from "@/lib/product-query"

const meta = {
  title: "Product/Toolbar/SortMenu",
  component: SortMenu,
  tags: ["autodocs"],
  args: { sort: "latest", onSortChange: () => {} },
  argTypes: { sort: { control: "inline-radio", options: ["latest", "name-asc", "name-desc"] } }
} satisfies Meta<typeof SortMenu>

export default meta
type Story = StoryObj<typeof meta>

function ControlledSortMenu({ initial = "latest" }: { initial?: SortMode }) {
  const [sort, setSort] = useState<SortMode>(initial)
  return <SortMenu sort={sort} onSortChange={setSort} />
}

export const Interactive: Story = {
  render: () => <ControlledSortMenu />
}

export const NameAsc: Story = {
  render: () => <ControlledSortMenu initial="name-asc" />
}
