import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  tags: ["autodocs"]
} satisfies Meta<typeof Tabs>

export default meta
type Story = StoryObj<typeof meta>

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="all" className="w-fit">
      <TabsList variant="line" activateOnFocus>
        <TabsTrigger value="all">全部</TabsTrigger>
        <TabsTrigger value="latest">最新</TabsTrigger>
        <TabsTrigger value="featured">精选</TabsTrigger>
      </TabsList>
      <TabsContent value="all">全部内容</TabsContent>
      <TabsContent value="latest">最新内容</TabsContent>
      <TabsContent value="featured">精选内容</TabsContent>
    </Tabs>
  )
}

function ControlledTabs() {
  const [value, setValue] = useState("all")
  return (
    <Tabs value={value} onValueChange={(v) => setValue(v as string)} className="w-fit">
      <TabsList>
        <TabsTrigger value="all">全部</TabsTrigger>
        <TabsTrigger value="latest">最新</TabsTrigger>
        <TabsTrigger value="featured">精选</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}

export const Default: Story = {
  render: () => <ControlledTabs />
}
