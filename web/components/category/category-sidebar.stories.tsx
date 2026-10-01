import { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { CategorySidebar } from "@/components/category/category-sidebar"
import { mockCategories, mockCategoryCounts } from "../../.storybook/fixtures"

const meta = {
  title: "Category/CategorySidebar",
  component: CategorySidebar,
  tags: ["autodocs"],
  args: { categories: mockCategories, categoryCounts: mockCategoryCounts, totalProducts: 85 },
  parameters: { layout: "fullscreen" }
} satisfies Meta<typeof CategorySidebar>

export default meta
type Story = StoryObj<typeof meta>

/** 清理折叠状态，保证 story 初始为展开（根元素 hidden md:flex，需 ≥768px 视口） */
function Clean({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem("xigee:sidebar-collapsed")
    } catch {
      /* noop */
    }
    document.documentElement.setAttribute("data-sidebar", "expanded")
  }, [])
  return <div className="flex h-[600px] bg-background">{children}</div>
}

export const Expanded: Story = {
  render: (args) => (
    <Clean>
      <CategorySidebar {...args} />
    </Clean>
  )
}

export const Collapsed: Story = {
  render: (args) => (
    <Clean>
      <CategorySidebar {...args} />
    </Clean>
  ),
  play: async () => {
    try {
      localStorage.setItem("xigee:sidebar-collapsed", "true")
    } catch {
      /* noop */
    }
    document.documentElement.setAttribute("data-sidebar", "collapsed")
    window.dispatchEvent(new Event("xigee:sidebar-collapse"))
  }
}
