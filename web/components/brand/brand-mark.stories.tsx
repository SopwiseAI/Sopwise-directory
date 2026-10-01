import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { BrandMark } from "@/components/brand/brand-mark"

const meta = {
  title: "Brand/BrandMark",
  component: BrandMark,
  tags: ["autodocs"],
  args: { size: "md" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    glyphClassName: { control: "text" },
    className: { control: "text" }
  }
} satisfies Meta<typeof BrandMark>

export default meta
type Story = StoryObj<typeof meta>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <BrandMark key={s} size={s} />
      ))}
    </div>
  )
}

export const Playground: Story = {}

export const GlyphOverride: Story = {
  render: () => <BrandMark size="lg" glyphClassName="size-3" />
}

export const RoundedFull: Story = {
  render: () => <BrandMark size="lg" className="rounded-full" />
}
