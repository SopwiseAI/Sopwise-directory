import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ToolRow } from "@/components/tool/tool-row"
import { mockTool, mockTools } from "@/.storybook/fixtures"

const meta = {
  title: "Tool/ToolRow",
  component: ToolRow,
  tags: ["autodocs"],
  args: { tool: mockTool },
  argTypes: {
    last: { control: "boolean" },
  },
} satisfies Meta<typeof ToolRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithTopic: Story = {
  args: { topicLabel: "对话助手", topicIcon: "💬" },
}

export const List: Story = {
  render: () => (
    <div className="max-w-3xl overflow-hidden rounded-lg border border-border">
      {mockTools.slice(0, 3).map((p, i) => (
        <ToolRow key={p.id} tool={p} topicLabel="对话助手" topicIcon="💬" last={i === 2} />
      ))}
    </div>
  ),
}
