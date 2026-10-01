import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductRow } from "@/components/product/product-row"
import { mockProduct } from "../../.storybook/fixtures"

const meta = {
  title: "Product/ProductRow",
  component: ProductRow,
  tags: ["autodocs"],
  args: { product: mockProduct },
  argTypes: {
    showDate: { control: "boolean" },
    last: { control: "boolean" }
  }
} satisfies Meta<typeof ProductRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDate: Story = {
  args: { showDate: true }
}

export const List: Story = {
  render: () => (
    <div className="max-w-3xl overflow-hidden rounded-lg border border-border">
      <ProductRow product={mockProduct} showDate />
      <ProductRow
        product={{
          id: "claude",
          name: "Claude",
          description: "Anthropic 的 AI 助手，擅长长文本理解与安全对齐。",
          url: "https://claude.ai",
          categories: ["chat-assistant"],
          tags: ["对话", "长文本"],
          pricing: "freemium"
        }}
        showDate
      />
      <ProductRow
        product={{
          id: "midjourney",
          name: "Midjourney",
          description: "高质量 AI 图像生成工具。",
          url: "https://www.midjourney.com",
          categories: ["image-generation"],
          tags: ["图像"],
          pricing: "paid"
        }}
        showDate
        last
      />
    </div>
  )
}
