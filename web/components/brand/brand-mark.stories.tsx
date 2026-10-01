import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { BrandGlyph, BrandMark } from "@/components/brand/brand-mark"

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

export const Glyph: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-foreground">
      {(["size-3", "size-6", "size-8", "size-12", "size-16"] as const).map((s) => (
        <BrandGlyph key={s} className={s} />
      ))}
    </div>
  )
}
