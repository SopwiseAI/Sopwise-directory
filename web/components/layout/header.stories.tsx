import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import Header from "@/components/layout/header"

const meta = {
  title: "Layout/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" }
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

/** 移动端顶部栏（根元素 md:hidden，需 <768px 视口查看） */
export const Default: Story = {}
