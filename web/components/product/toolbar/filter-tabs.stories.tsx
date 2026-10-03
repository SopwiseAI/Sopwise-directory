import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { FilterTabs } from "@/components/product/toolbar/filter-tabs"
import type { TabMode } from "@/lib/product-query"

const meta = {
  title: "Product/Toolbar/FilterTabs",
  component: FilterTabs,
  tags: ["autodocs"],
  args: { tab: "all", onTabChange: () => {} },
  argTypes: { tab: { control: "inline-radio", options: ["all", "latest", "featured"] } }
} satisfies Meta<typeof FilterTabs>

export default meta
type Story = StoryObj<typeof meta>

function ControlledFilterTabs({ initial = "all" }: { initial?: TabMode }) {
  const [tab, setTab] = useState<TabMode>(initial)
  return <FilterTabs tab={tab} onTabChange={setTab} />
}

export const Interactive: Story = {
  render: () => <ControlledFilterTabs />
}

export const Latest: Story = {
  render: () => <ControlledFilterTabs initial="latest" />
}

export const Featured: Story = {
  render: () => <ControlledFilterTabs initial="featured" />
}
