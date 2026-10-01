import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CopyrightYear } from "@/components/layout/copyright-year"

const meta = {
  title: "Layout/CopyrightYear",
  component: CopyrightYear,
  tags: ["autodocs"],
  argTypes: { className: { control: "text" } }
} satisfies Meta<typeof CopyrightYear>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Styled: Story = {
  args: { className: "font-mono text-sm text-muted-foreground" }
}
