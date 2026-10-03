import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductRow } from "@/components/product/product-row"
import { mockProduct, mockProducts } from "@/.storybook/fixtures"

const meta = {
  title: "Product/ProductRow",
  component: ProductRow,
  tags: ["autodocs"],
  args: { product: mockProduct },
  argTypes: {
    last: { control: "boolean" }
  }
} satisfies Meta<typeof ProductRow>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithCategory: Story = {
  args: { categoryLabel: "对话助手", categoryIcon: "message-square" }
}

export const List: Story = {
  render: () => (
    <div className="max-w-3xl overflow-hidden rounded-lg border border-border">
      {mockProducts.slice(0, 3).map((p, i) => (
        <ProductRow key={p.id} product={p} categoryLabel="对话助手" categoryIcon="message-square" last={i === 2} />
      ))}
    </div>
  )
}
