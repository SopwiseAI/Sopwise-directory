import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ViewToggle } from "@/components/tool/toolbar/view-toggle"
import type { ViewMode } from "@/lib/tool-query"

const meta = {
  title: "Tool/Toolbar/ViewToggle",
  component: ViewToggle,
  tags: ["autodocs"],
  args: { view: "grid", onViewChange: () => {} },
  argTypes: { view: { control: "inline-radio", options: ["grid", "list"] } },
} satisfies Meta<typeof ViewToggle>

export default meta
type Story = StoryObj<typeof meta>

function ControlledViewToggle({ initial = "grid" }: { initial?: ViewMode }) {
  const [view, setView] = useState<ViewMode>(initial)
  return <ViewToggle view={view} onViewChange={setView} />
}

export const Interactive: Story = {
  render: () => <ControlledViewToggle />,
}

export const List: Story = {
  render: () => <ControlledViewToggle initial="list" />,
}
