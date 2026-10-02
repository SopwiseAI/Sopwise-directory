import { Suspense } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { SearchResults } from "@/components/search/search-results"
import { mockProducts } from "@/.storybook/fixtures"

const featured = mockProducts.filter((p) => p.featured)

const meta = {
  title: "Search/SearchResults",
  component: SearchResults,
  tags: ["autodocs"],
  args: { products: mockProducts, featured },
  decorators: [
    (Story) => (
      <Suspense fallback={<div className="text-sm text-muted-foreground">加载中…</div>}>
        <Story />
      </Suspense>
    )
  ]
} satisfies Meta<typeof SearchResults>

export default meta
type Story = StoryObj<typeof meta>

/** 无查询：空态提示 */
export const Empty: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { query: {} } } }
}

/** 有结果：命中「对话 / AI」等关键词 */
export const WithResults: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { query: { q: "对话" } } } }
}

/** 无结果：展示 suggestions + featured 推荐 */
export const NoResults: Story = {
  parameters: { nextjs: { appDirectory: true, navigation: { query: { q: "zzzznotfound" } } } }
}
