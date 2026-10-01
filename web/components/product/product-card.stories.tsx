import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductCard } from "@/components/product/product-card"
import { mockProduct } from "../../.storybook/fixtures"

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: { product: mockProduct },
  argTypes: { showDate: { control: "boolean" } }
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithDate: Story = {
  args: { showDate: true }
}

export const MinimalProduct: Story = {
  args: {
    product: {
      id: "minimal",
      name: "Minimal AI",
      description: "没有标签与价格信息的最小产品卡片。",
      url: "https://example.com",
      categories: ["chat-assistant"]
    }
  }
}

export const Grid: Story = {
  render: () => (
    <div className="grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
      <ProductCard product={mockProduct} showDate />
      <ProductCard
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
    </div>
  )
}
