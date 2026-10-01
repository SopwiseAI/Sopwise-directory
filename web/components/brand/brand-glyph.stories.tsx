import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { BrandGlyph } from "@/components/brand/brand-mark"

const meta = {
  title: "Brand/BrandGlyph",
  component: BrandGlyph,
  tags: ["autodocs"],
  argTypes: { className: { control: "text" } }
} satisfies Meta<typeof BrandGlyph>

export default meta
type Story = StoryObj<typeof meta>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-foreground">
      {(["size-3", "size-6", "size-8", "size-12", "size-16"] as const).map((s) => (
        <BrandGlyph key={s} className={s} />
      ))}
    </div>
  )
}

export const Colors: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <BrandGlyph className="size-8 text-brand" />
      <BrandGlyph className="size-8 text-muted-foreground" />
      <BrandGlyph className="size-8 text-destructive" />
    </div>
  )
}
