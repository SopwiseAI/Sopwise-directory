import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Wordmark } from "@/components/brand/wordmark"

const meta = {
  title: "Brand/Wordmark",
  component: Wordmark,
  tags: ["autodocs"],
  args: { size: "md", tone: "default" },
  argTypes: {
    size: { control: "inline-radio", options: ["sm", "md", "lg", "xl"] },
    tone: { control: "inline-radio", options: ["default", "brand"] }
  }
} satisfies Meta<typeof Wordmark>

export default meta
type Story = StoryObj<typeof meta>

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} className="flex items-center gap-8">
          <Wordmark size={s} />
          <Wordmark size={s} tone="brand" />
        </div>
      ))}
    </div>
  )
}

export const Playground: Story = {}
