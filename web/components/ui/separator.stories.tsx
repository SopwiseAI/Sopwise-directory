import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Separator } from "@/components/ui/separator"

const meta = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } }
} satisfies Meta<typeof Separator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 space-y-4">
      <div>上方内容</div>
      <Separator />
      <div>下方内容</div>
    </div>
  )
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-8 items-center gap-4">
      <span>左</span>
      <Separator orientation="vertical" />
      <span>右</span>
    </div>
  )
}
