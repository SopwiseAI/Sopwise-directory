import { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductBrowser } from "@/components/product/product-browser"
import { mockProducts } from "../../.storybook/fixtures"

const meta = {
  title: "Product/ProductBrowser",
  component: ProductBrowser,
  tags: ["autodocs"],
  args: { products: mockProducts },
  decorators: [
    (Story) => {
      useEffect(() => {
        try {
          localStorage.removeItem("xigee:default-view")
          localStorage.removeItem("xigee:default-sort")
        } catch {
          /* noop */
        }
      }, [])
      return <Story />
    }
  ]
} satisfies Meta<typeof ProductBrowser>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ListView: Story = {
  args: { defaultView: "list" }
}

export const WithoutTabs: Story = {
  args: { showTabs: false }
}

export const Empty: Story = {
  args: {
    products: [],
    emptyTitle: "该分类暂无产品",
    emptyDescription: "换个分类看看吧"
  }
}
