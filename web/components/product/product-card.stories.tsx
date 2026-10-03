import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductCard } from "@/components/product/product-card"
import { mockProduct, mockProducts } from "@/.storybook/fixtures"

const meta = {
  title: "Product/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
  args: { product: mockProduct }
} satisfies Meta<typeof ProductCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithCategory: Story = {
  args: { categoryLabel: "对话助手", categoryIcon: "message-square" }
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
      {mockProducts.slice(0, 2).map((p) => (
        <ProductCard key={p.id} product={p} categoryLabel="对话助手" categoryIcon="message-square" />
      ))}
    </div>
  )
}
