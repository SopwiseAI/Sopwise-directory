import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import { Search } from "lucide-react"

const meta = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "输入内容…" }
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Invalid: Story = {
  args: { "aria-invalid": true, defaultValue: "错误输入" }
}

export const WithInputGroup: Story = {
  render: () => (
    <InputGroup className="max-w-xs">
      <InputGroupAddon>
        <Search className="text-muted-foreground/60" />
      </InputGroupAddon>
      <InputGroupInput placeholder="搜索 AI 产品…" aria-label="搜索 AI 产品" />
      <InputGroupAddon align="inline-end">
        <InputGroupText>
          <Kbd>/</Kbd>
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  )
}
