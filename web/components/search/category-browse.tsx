import Link from "next/link"
import { categoryIconNode } from "@/lib/category-icon-node"
import { formatCount } from "@/lib/format"
import type { Category } from "@/lib/types"

interface CategoryBrowseProps {
  categories: readonly Category[]
  categoryCounts: Record<string, number>
}

/** 分类浏览网格：搜索的兜底出口，给「不知道搜什么」的用户一条按分类走的路。 */
export function CategoryBrowse({ categories, categoryCounts }: CategoryBrowseProps) {
  const list = categories.filter((c) => (categoryCounts[c.id] ?? 0) > 0)
  if (list.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
        按分类浏览
        <span className="font-data text-xs font-normal text-muted-foreground">CATEGORIES</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((category) => (
          <Link
            key={category.id}
            href={`/category/${category.id}`}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors outline-none hover:border-brand/30 hover:bg-brand/[0.03] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
              {categoryIconNode(category.icon, "size-4")}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{category.name}</span>
            <span className="shrink-0 font-data text-xs text-muted-foreground">
              {formatCount(categoryCounts[category.id] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
