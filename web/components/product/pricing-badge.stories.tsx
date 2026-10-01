import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PricingBadge } from "@/components/product/pricing-badge"

const meta = {
  title: "Product/PricingBadge",
  component: PricingBadge,
  tags: ["autodocs"],
  args: { pricing: "free" },
  argTypes: {
    pricing: { control: "inline-radio", options: ["free", "freemium", "paid", "opensource"] }
  }
} satisfies Meta<typeof PricingBadge>

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <PricingBadge pricing="free" />
      <PricingBadge pricing="freemium" />
      <PricingBadge pricing="paid" />
      <PricingBadge pricing="opensource" />
    </div>
  )
}

export const Playground: Story = {}
