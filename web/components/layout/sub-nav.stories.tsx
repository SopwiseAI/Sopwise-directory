import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SubNav } from "@/components/layout/sub-nav"
import { mockTopics } from "@/.storybook/fixtures"

const meta = {
  title: "Layout/SubNav",
  component: SubNav,
  tags: ["autodocs"],
  args: { topics: mockTopics },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SubNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
