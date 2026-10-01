import { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { HistoryList } from "@/components/history/history-list"
import { mockCategories } from "../../.storybook/fixtures"
import type { HistoryItem } from "@/lib/history"

const STORAGE_KEY = "xigee:history"

function seed(items: HistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 2, items }))
  } catch {
    /* noop */
  }
  window.dispatchEvent(new Event("xigee:history-change"))
}

function Seed({ items, children }: { items: HistoryItem[]; children: React.ReactNode }) {
  useEffect(() => {
    seed(items)
    return () => {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* noop */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return <>{children}</>
}

const now = Date.now()
const iso = (minsAgo: number) => new Date(now - minsAgo * 60_000).toISOString()

const sampleItems: HistoryItem[] = [
  {
    id: "openai-chatgpt",
    name: "ChatGPT",
    url: "https://chat.openai.com",
    domain: "chat.openai.com",
    categoryId: "chat-assistant",
    pricing: "freemium",
    lastVisitedAt: iso(3),
    firstVisitedAt: iso(600),
    visitCount: 12
  },
  {
    id: "anthropic-claude",
    name: "Claude",
    url: "https://claude.ai",
    domain: "claude.ai",
    categoryId: "chat-assistant",
    pricing: "freemium",
    lastVisitedAt: iso(90),
    firstVisitedAt: iso(2000),
    visitCount: 4
  },
  {
    id: "midjourney",
    name: "Midjourney",
    url: "https://www.midjourney.com",
    domain: "midjourney.com",
    categoryId: "image-generation",
    pricing: "paid",
    lastVisitedAt: iso(1500),
    firstVisitedAt: iso(9000),
    visitCount: 2
  },
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    url: "https://github.com/features/copilot",
    domain: "github.com",
    categoryId: "code-tools",
    pricing: "paid",
    lastVisitedAt: iso(6000),
    firstVisitedAt: iso(20000),
    visitCount: 1
  }
]

const meta = {
  title: "History/HistoryList",
  component: HistoryList,
  tags: ["autodocs"],
  args: { categories: mockCategories }
} satisfies Meta<typeof HistoryList>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {
  decorators: [
    (Story) => (
      <Seed items={[]}>
        <Story />
      </Seed>
    )
  ]
}

export const WithItems: Story = {
  decorators: [
    (Story) => (
      <Seed items={sampleItems}>
        <Story />
      </Seed>
    )
  ]
}
