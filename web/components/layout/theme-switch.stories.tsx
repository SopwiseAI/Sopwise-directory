import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ThemeSwitch } from "@/components/layout/theme-switch"

const meta = {
  title: "Layout/ThemeSwitch",
  component: ThemeSwitch,
  tags: ["autodocs"]
} satisfies Meta<typeof ThemeSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
