import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HeroEyebrow } from "@/components/hero/hero-primitives"

const meta = {
  title: "Hero/HeroEyebrow",
  component: HeroEyebrow,
  tags: ["autodocs"],
  args: { children: "AI Discovery Engine" },
  argTypes: { className: { control: "text" } }
} satisfies Meta<typeof HeroEyebrow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CustomColor: Story = {
  args: { children: "Custom Color", className: "text-foreground" }
}
