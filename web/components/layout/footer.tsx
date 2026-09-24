import Link from "next/link"
import { getAllCategories, getAllProducts } from "@/lib/data"
import { BrandMark } from "@/components/layout/brand-mark"
import { formatCount } from "@/lib/format"
import pkg from "@/package.json"

const categories = getAllCategories()
const totalProducts = getAllProducts().length
const appVersion = pkg.version

export default function Footer() {
  return (
    <footer className="mt-8 border-t bg-card/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BrandMark size="sm" />
              <span className="text-sm font-semibold tracking-tight">
                XiGee<span className="text-xs font-normal text-muted-foreground">.net</span>
              </span>
            </div>
            <p className="max-w-xs text-xs text-muted-foreground">
              你的 AI 发现引擎 · 精选 {totalProducts} 款 AI 工具与应用
            </p>
          </div>

          <nav className="flex max-w-sm flex-wrap gap-x-1 gap-y-2" aria-label="分类">
            {categories.slice(0, 8).map(c => (
              <Link
                key={c.id}
                href={`/category/${c.id}`}
                className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {c.name}
              </Link>
            ))}
          </nav>

          <nav className="flex flex-col gap-2" aria-label="关于">
            <p className="text-xs font-medium text-foreground">关于</p>
            <Link
              href="/settings"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              关于 XiGee
            </Link>
            <Link
              href="#"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              提交产品
            </Link>
            <Link
              href="#"
              className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              建议反馈
            </Link>
          </nav>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
          <p className="font-data text-muted-foreground">
            &copy; {new Date().getFullYear()} XiGee · v{appVersion}
          </p>
          <p className="font-data text-muted-foreground">
            {formatCount(totalProducts)} 个产品 · {formatCount(categories.length)} 个分类
          </p>
        </div>
      </div>
    </footer>
  )
}
