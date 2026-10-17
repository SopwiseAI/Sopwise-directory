import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ToolCard } from "@/components/tool/tool-card"
import { mockTool, mockTools } from "@/.storybook/fixtures"

const meta = {
  title: "Tool/ToolCard",
  component: ToolCard,
  tags: ["autodocs"],
  args: { tool: mockTool },
} satisfies Meta<typeof ToolCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithTopic: Story = {
  args: { topicLabel: "对话助手", topicIcon: "message-square" },
}

export const MinimalTool: Story = {
  args: {
    tool: {
      id: "minimal",
      name: "Minimal AI",
      description: "没有标签与价格信息的最小工具卡片。",
      url: "https://example.com",
      topics: ["chat-assistant"],
    },
  },
}

export const Grid: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      {mockTools.slice(0, 2).map((p) => (
        <ToolCard key={p.id} tool={p} topicLabel="对话助手" topicIcon="message-square" />
      ))}
    </div>
  ),
}
