import type { Metadata } from "next"
import Link from "next/link"
import { getAllCategories, getCategoryCounts } from "@/lib/data"
import { formatCount } from "@/lib/format"
import { resolveCrumbs } from "@/lib/breadcrumbs"
import { absoluteUrl, breadcrumbLd, collectionPageLd } from "@/lib/seo"
import { categoryHref } from "@/lib/url"
import { pageShell } from "@/lib/layout"
import { categoryIconNode } from "@/lib/category-icon-node"
import { JsonLd } from "@/components/seo/json-ld"

const categories = getAllCategories()
const counts = getCategoryCounts()

const TITLE = "AI 工具分类"
const DESCRIPTION = `XiGee 的 AI 工具分类总览：按 ${categories.length} 个分类浏览精选 AI 工具，每一款都经过人工筛选，点击直达官方网站。`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/category" },
  openGraph: { title: `${TITLE} — XiGee`, description: DESCRIPTION }
}

/**
 * 分类索引页：目录站的「枢纽」页。
 *
 * 之前分类只能靠每页重复的侧栏/分类条被发现，没有一个可收录的分类总览页 ——
 * 既少了一个承接「AI 工具分类」这类词的落地页，也让内链结构缺一层。
 */
export default function CategoryIndexPage() {
  const crumbs = resolveCrumbs("/category", { categories })
  const url = absoluteUrl("/category")
  const items = categories.map((category) => ({
    name: category.name,
    url: absoluteUrl(categoryHref(category.id))
  }))

  return (
    <div className={pageShell("browse", "flex flex-col gap-5")}>
      <JsonLd data={breadcrumbLd(crumbs, url)} />
      <JsonLd data={collectionPageLd({ name: TITLE, description: DESCRIPTION, url, items })} />

      <header className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight">{TITLE}</h1>
        <p className="text-sm text-muted-foreground">共 {categories.length} 个分类，每一款工具都经过人工筛选。</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const count = counts[category.id] ?? 0
          return (
            <Link
              key={category.id}
              href={categoryHref(category.id)}
              className="group flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/15 hover:bg-secondary/50"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-foreground">
                {categoryIconNode(category.icon, "size-4")}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="truncate text-base font-semibold tracking-tight">{category.name}</span>
                  <span className="shrink-0 font-data text-xs text-muted-foreground">{formatCount(count)} 个</span>
                </span>
                {category.description && (
                  <span className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {category.description}
                  </span>
                )}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
