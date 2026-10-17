import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ToolToolbar } from "@/components/tool/toolbar/tool-toolbar"
import type { SortMode, TabMode, ViewMode } from "@/lib/tool-query"

const meta = {
  title: "Tool/Toolbar/ToolToolbar",
  component: ToolToolbar,
  tags: ["autodocs"],
  args: {
    view: "grid",
    tab: "all",
    sort: "latest",
    onViewChange: () => {},
    onTabChange: () => {},
    onSortChange: () => {},
  },
  argTypes: { showTabs: { control: "boolean" } },
} satisfies Meta<typeof ToolToolbar>

export default meta
type Story = StoryObj<typeof meta>

function Demo({ showTabs = true }: { showTabs?: boolean }) {
  const [view, setView] = useState<ViewMode>("grid")
  const [tab, setTab] = useState<TabMode>("all")
  const [sort, setSort] = useState<SortMode>("latest")
  return (
    <div className="max-w-2xl">
      <ToolToolbar
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
  render: () => <Demo showTabs />,
}

export const WithoutTabs: Story = {
  render: () => <Demo showTabs={false} />,
}
