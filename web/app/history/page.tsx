import type { Metadata } from "next"
import { HistoryList } from "@/components/history/history-list"

export const metadata: Metadata = {
  title: "历史记录",
  description: "ailulu 访问历史：快速回到之前浏览过的 AI 产品",
  robots: { index: false, follow: true },
}

export default function HistoryPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">历史记录</h1>
      <HistoryList />
    </div>
  )
}