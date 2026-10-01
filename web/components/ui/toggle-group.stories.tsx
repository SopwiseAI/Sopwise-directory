import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const meta = {
  title: "UI/ToggleGroup",
  component: ToggleGroup,
  tags: ["autodocs"]
} satisfies Meta<typeof ToggleGroup>

export default meta
type Story = StoryObj<typeof meta>

function SingleDemo() {
  const [value, setValue] = useState<string[]>(["center"])
  return (
    <ToggleGroup value={value} onValueChange={(v) => setValue(v as string[])} variant="outline">
      <ToggleGroupItem value="left">左</ToggleGroupItem>
      <ToggleGroupItem value="center">中</ToggleGroupItem>
      <ToggleGroupItem value="right">右</ToggleGroupItem>
    </ToggleGroup>
  )
}

function MultipleDemo() {
  const [value, setValue] = useState<string[]>(["bold"])
  return (
    <ToggleGroup multiple value={value} onValueChange={(v) => setValue(v as string[])} variant="outline">
      <ToggleGroupItem value="bold">粗体</ToggleGroupItem>
      <ToggleGroupItem value="italic">斜体</ToggleGroupItem>
      <ToggleGroupItem value="underline">下划线</ToggleGroupItem>
    </ToggleGroup>
  )
}

export const Single: Story = {
  render: () => <SingleDemo />
}

export const Multiple: Story = {
  render: () => <MultipleDemo />
}
