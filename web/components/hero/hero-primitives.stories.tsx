import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HeroBackdrop } from "@/components/hero/hero-primitives"

const meta = {
  title: "Hero/HeroBackdrop",
  component: HeroBackdrop,
  tags: ["autodocs"],
  argTypes: {
    align: { control: "inline-radio", options: ["left", "center"] },
    className: { control: "text" }
  }
} satisfies Meta<typeof HeroBackdrop>

export default meta
type Story = StoryObj<typeof meta>

function Frame({ align }: { align: "left" | "center" }) {
  return (
    <div className="relative h-64 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-secondary/50 to-background">
      <HeroBackdrop align={align} />
    </div>
  )
}

export const Left: Story = {
  render: () => <Frame align="left" />
}

export const Center: Story = {
  render: () => <Frame align="center" />
}
