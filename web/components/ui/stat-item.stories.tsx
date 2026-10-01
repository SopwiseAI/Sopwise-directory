import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { StatItem } from "@/components/ui/stat-item"

const meta = {
  title: "UI/StatItem",
  component: StatItem,
  tags: ["autodocs"],
  args: { label: "产品", value: 1234, size: "sm" },
  argTypes: {
    label: { control: "text" },
    value: { control: "number" },
    size: { control: "inline-radio", options: ["sm", "lg"] }
  }
} satisfies Meta<typeof StatItem>

export default meta
type Story = StoryObj<typeof meta>

export const Playground: Story = {}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <StatItem label="产品" value={1234} size="sm" />
      <StatItem label="产品" value={1234} size="lg" />
    </div>
  )
}

export const LargeNumber: Story = {
  args: { label: "访问量", value: 128456, size: "lg" }
}
