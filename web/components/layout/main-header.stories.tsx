import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { MainHeader } from "@/components/layout/main-header"
import { mockTopics, mockSuggestionDocs } from "@/.storybook/fixtures"

const meta = {
  title: "Layout/MainHeader",
  component: MainHeader,
  tags: ["autodocs"],
  args: { topics: mockTopics, suggestions: mockSuggestionDocs },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MainHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoTopics: Story = {
  args: { topics: [], suggestions: [] },
}
