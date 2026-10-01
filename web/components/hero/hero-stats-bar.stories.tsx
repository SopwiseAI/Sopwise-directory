import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HeroStatsBar } from "@/components/hero/hero-stats-bar"

const meta = {
  title: "Hero/HeroStatsBar",
  component: HeroStatsBar,
  tags: ["autodocs"],
  args: { stats: { products: 1280, categories: 22, featured: 64 } },
  argTypes: {
    stats: { control: "object" }
  }
} satisfies Meta<typeof HeroStatsBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LargeNumbers: Story = {
  args: { stats: { products: 128456, categories: 156, featured: 1024 } }
}

export const SmallNumbers: Story = {
  args: { stats: { products: 3, categories: 1, featured: 0 } }
}
