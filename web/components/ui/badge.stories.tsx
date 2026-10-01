import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Badge } from "@/components/ui/badge"

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Badge" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "secondary", "destructive", "outline", "ghost", "link"]
    }
  }
} satisfies Meta<typeof Badge>

export default meta
type Story = StoryObj<typeof meta>

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="default">Default</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="outline">Outline</Badge>
      <Badge variant="ghost">Ghost</Badge>
      <Badge variant="link">Link</Badge>
    </div>
  )
}

export const Playground: Story = {}

export const AsLink: Story = {
  render: () => (
    <Badge render={<a href="#" />} variant="outline">
      Link Badge
    </Badge>
  )
}
