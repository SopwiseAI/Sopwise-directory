import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Button" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "brand", "outline", "secondary", "ghost", "destructive", "link"]
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"]
    },
    isLoading: { control: "boolean" },
    disabled: { control: "boolean" }
  }
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="default">Default</Button>
      <Button variant="brand">Brand</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="link">Link</Button>
    </div>
  )
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="xs">xs</Button>
      <Button size="sm">sm</Button>
      <Button size="default">default</Button>
      <Button size="lg">lg</Button>
    </div>
  )
}

export const IconSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button size="icon-xs" aria-label="icon-xs">
        +
      </Button>
      <Button size="icon-sm" aria-label="icon-sm">
        +
      </Button>
      <Button size="icon" aria-label="icon">
        +
      </Button>
      <Button size="icon-lg" aria-label="icon-lg">
        +
      </Button>
    </div>
  )
}

export const Loading: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button isLoading>提交中</Button>
      <Button isLoading variant="outline">
        加载
      </Button>
    </div>
  )
}

export const Playground: Story = {}
