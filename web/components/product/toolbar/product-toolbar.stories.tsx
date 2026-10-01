import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductToolbar } from "@/components/product/toolbar/product-toolbar"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

const meta = {
  title: "Product/Toolbar/ProductToolbar",
  component: ProductToolbar,
  tags: ["autodocs"],
  args: {
    view: "grid",
    tab: "all",
    sort: "latest",
    onViewChange: () => {},
    onTabChange: () => {},
    onSortChange: () => {}
  },
  argTypes: { showTabs: { control: "boolean" } }
} satisfies Meta<typeof ProductToolbar>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ showTabs = true }: { showTabs?: boolean }) {
  const [view, setView] = useState<ViewMode>("grid")
  const [tab, setTab] = useState<TabMode>("all")
  const [sort, setSort] = useState<SortMode>("latest")
  return (
    <div className="max-w-2xl">
      <ProductToolbar
        view={view}
        tab={tab}
        sort={sort}
        onViewChange={setView}
        onTabChange={setTab}
        onSortChange={setSort}
        showTabs={showTabs}
      />
    </div>
  )
}

export const WithTabs: Story = {
  render: () => <Demo showTabs />
}

export const WithoutTabs: Story = {
  render: () => <Demo showTabs={false} />
}
