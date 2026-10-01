import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { PanelIcon } from "@/components/brand/panel-icon"

const meta = {
  title: "Brand/PanelIcon",
  component: PanelIcon,
  tags: ["autodocs"],
  args: { className: "size-6 text-foreground" },
  argTypes: { className: { control: "text" } }
} satisfies Meta<typeof PanelIcon>

export default meta
type Story = StoryObj<typeof meta>

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4 text-foreground">
      {(["size-3", "size-4", "size-5", "size-6", "size-8"] as const).map((s) => (
        <PanelIcon key={s} className={s} />
      ))}
    </div>
  )
}

export const Playground: Story = {}
