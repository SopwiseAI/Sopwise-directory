import type { Metadata } from "next"
import Link from "next/link"
import { getAllCategories } from "@/lib/data"

export const metadata: Metadata = {
  title: "页面未找到",
  robots: { index: false }
}

const categories = getAllCategories()

export default function NotFound() {
  const topCategories = categories.slice(0, 4)

  return (
    <div className="flex flex-col items-center gap-6 py-20 text-center">
      <p className="font-mono text-6xl font-bold tabular-nums text-muted-foreground/40">404</p>
      <p className="text-sm text-muted-foreground">页面不存在</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        返回首页
      </Link>

      <div className="w-full max-w-sm space-y-3">
        <p className="font-data text-xs text-muted-foreground">试试搜索其他产品</p>
        <form action="/search" method="GET" className="flex gap-2">
          <input
            type="text"
            name="q"
            placeholder="搜索 AI 产品…"
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            搜索
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <p className="font-data text-xs text-muted-foreground">浏览分类</p>
        <div className="flex flex-wrap justify-center gap-2">
          {topCategories.map(cat => (
            <Link
              key={cat.id}
              href={`/category/${cat.id}`}
              className="inline-flex items-center rounded-md border bg-card px-3 py-1.5 text-sm transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
