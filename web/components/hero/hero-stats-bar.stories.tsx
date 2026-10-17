import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HeroStatsBar } from "@/components/hero/hero-stats-bar"

const meta = {
  title: "Hero/HeroStatsBar",
  component: HeroStatsBar,
  tags: ["autodocs"],
  args: { stats: { tools: 1280, topics: 22, featured: 64 } },
  argTypes: {
    stats: { control: "object" },
  },
} satisfies Meta<typeof HeroStatsBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LargeNumbers: Story = {
  args: { stats: { tools: 128456, topics: 156, featured: 1024 } },
}

export const SmallNumbers: Story = {
  args: { stats: { tools: 3, topics: 1, featured: 0 } },
}
