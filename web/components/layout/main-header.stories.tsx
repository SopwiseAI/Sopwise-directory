import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MainHeader } from "@/components/layout/main-header"
import { mockCategories, mockSuggestionDocs } from "@/.storybook/fixtures"

const meta = {
  title: "Layout/MainHeader",
  component: MainHeader,
  tags: ["autodocs"],
  args: { categories: mockCategories, suggestions: mockSuggestionDocs },
  parameters: { layout: "fullscreen" }
} satisfies Meta<typeof MainHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoCategories: Story = {
  args: { categories: [], suggestions: [] }
}
