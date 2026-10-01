import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HeroBackdrop, HeroEyebrow } from "@/components/hero/hero-primitives"

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
      <div className="relative flex h-full items-center justify-center">
        <HeroEyebrow>AI Discovery Engine</HeroEyebrow>
      </div>
    </div>
  )
}

export const Left: Story = {
  render: () => <Frame align="left" />
}

export const Center: Story = {
  render: () => <Frame align="center" />
}

export const Playground: Story = {
  render: () => <Frame align="left" />
}

export const Eyebrow: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <HeroEyebrow>AI Discovery Engine</HeroEyebrow>
      <HeroEyebrow className="text-foreground">Custom Color</HeroEyebrow>
    </div>
  )
}
