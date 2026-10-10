import type { Metadata } from "next"
import { getAllCategories } from "@/lib/data"
import { pageShell } from "@/lib/layout"
import { HistoryList } from "@/components/history/history-list"

export const metadata: Metadata = {
  title: "历史记录",
  description: "XiGee 访问历史：快速回到之前浏览过的 AI 工具",
  alternates: { canonical: "/history" },
  openGraph: { title: "历史记录" },
  robots: { index: false, follow: true }
}

const categories = getAllCategories()

export default function HistoryPage() {
  return (
    <div className={pageShell("content", "space-y-4")}>
      <h1 className="text-2xl font-semibold tracking-tight">历史记录</h1>
      <HistoryList categories={categories} />
    </div>
  )
}
