import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { ProductBrowser } from "@/components/product/product-browser"
import { mockProducts } from "@/.storybook/fixtures"

const meta = {
  title: "Product/ProductBrowser",
  component: ProductBrowser,
  tags: ["autodocs"],
  args: { products: mockProducts },
  // 渲染前清除持久化偏好，避免上一个 story 的 view/sort 泄露到本 story 首帧
  beforeEach: () => {
    try {
      localStorage.removeItem("xigee:default-view")
      localStorage.removeItem("xigee:default-sort")
    } catch {
      /* noop */
    }
  }
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
