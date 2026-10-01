import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Hero } from "@/components/hero/hero"

const meta = {
  title: "Hero/Hero",
  component: Hero,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" }
} satisfies Meta<typeof Hero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6">
      <Hero />
    </div>
  )
}
