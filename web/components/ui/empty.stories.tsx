import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Clock } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Button } from "@/components/ui/button"

const meta = {
  title: "UI/Empty",
  component: Empty,
  tags: ["autodocs"]
} satisfies Meta<typeof Empty>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Empty className="rounded-lg border">
      <EmptyMedia variant="icon">
        <Clock />
      </EmptyMedia>
      <EmptyHeader>
        <EmptyTitle>暂无访问记录</EmptyTitle>
        <EmptyDescription>浏览产品时自动记录，方便下次快速回到这里</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline">去逛逛</Button>
      </EmptyContent>
    </Empty>
  )
}
