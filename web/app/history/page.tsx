import type { Metadata } from "next"
import Link from "next/link"
import { getAllCategories } from "@/lib/data"
import { pageShell } from "@/lib/layout"
import { HistoryList } from "@/components/history/history-list"

export const metadata: Metadata = {
  title: "历史记录",
  description: "XiGee 历史记录：快速回到之前浏览过的 AI 工具；记录只保存在本机浏览器，不会上传。",
  alternates: { canonical: "/history" },
  openGraph: { title: "历史记录" },
  robots: { index: false, follow: true }
}

const categories = getAllCategories()

export default function HistoryPage() {
  return (
    <div className={pageShell("content", "flex flex-col gap-4")}>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">历史记录</h1>
        {/* 有记录时也要说清「只在本机」，并给出去设置里导出/清空的入口 */}
        <p className="text-sm text-muted-foreground">
          记录只保存在本机浏览器，不会上传；可以随时在{" "}
          <Link href="/settings" className="text-foreground underline-offset-4 hover:underline">
            设置
          </Link>{" "}
          里导出或清空。
        </p>
      </div>
      <HistoryList categories={categories} />
    </div>
  )
}
