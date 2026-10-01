import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SubNav } from "@/components/layout/sub-nav"
import { mockCategories, mockCategoryCounts } from "@/.storybook/fixtures"

const meta = {
  title: "Layout/SubNav",
  component: SubNav,
  tags: ["autodocs"],
  args: { categories: mockCategories, categoryCounts: mockCategoryCounts },
  parameters: { layout: "fullscreen" }
} satisfies Meta<typeof SubNav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
