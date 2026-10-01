import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    )
  ]
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger render={<Button variant="outline" />}>悬停查看</TooltipTrigger>
      <TooltipContent>这是一个提示气泡</TooltipContent>
    </Tooltip>
  )
}

export const Sides: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      {(["top", "bottom", "left", "right"] as const).map((side) => (
        <Tooltip key={side}>
          <TooltipTrigger render={<Button variant="outline" />}>{side}</TooltipTrigger>
          <TooltipContent side={side}>{side} 方向提示</TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}
