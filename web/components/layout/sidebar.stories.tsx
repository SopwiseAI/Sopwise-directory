import { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Sidebar } from "@/components/layout/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { mockCategories, mockCategoryCounts } from "@/.storybook/fixtures"

const meta = {
  title: "Layout/Sidebar",
  component: Sidebar,
  tags: ["autodocs"],
  args: { categories: mockCategories, categoryCounts: mockCategoryCounts, totalProducts: 85 },
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    )
  ]
} satisfies Meta<typeof Sidebar>

export default meta
type Story = StoryObj<typeof meta>

/** 清理折叠状态并在渲染前派发事件，保证同文档切换 story 时状态同步 */
function Clean({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    try {
      localStorage.removeItem("xigee:sidebar-collapsed")
    } catch {
      /* noop */
    }
    document.documentElement.setAttribute("data-sidebar", "expanded")
    window.dispatchEvent(new Event("xigee:sidebar-collapse"))
  }, [])
  return <div className="flex h-[600px] bg-background">{children}</div>
}

export const Expanded: Story = {
  render: (args) => (
    <Clean>
      <Sidebar {...args} />
    </Clean>
  )
}

export const Collapsed: Story = {
  render: (args) => (
    <Clean>
      <Sidebar {...args} />
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
