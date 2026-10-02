import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import PageError from "@/app/error"

const meta = {
  title: "App/Error",
  component: PageError,
  parameters: { layout: "centered" },
  args: {
    error: new Error("Failed to load (preview)"),
    reset: () => {}
  }
} satisfies Meta<typeof PageError>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
