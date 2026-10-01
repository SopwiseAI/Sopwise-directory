import Link from "next/link"
import { getStats } from "@/lib/data"
import { Wordmark } from "@/components/brand/wordmark"
import { CopyrightYear } from "@/components/layout/copyright-year"
import { formatCount } from "@/lib/format"
import pkg from "@/package.json"

const stats = getStats()
const appVersion = pkg.version

export default function Footer() {
  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="XiGee.net 首页"
            className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Wordmark size="sm" />
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-data text-xs text-muted-foreground/60">v{appVersion}</span>
          <span className="hidden text-xs text-muted-foreground/40 sm:inline">·</span>
          <span className="hidden font-data text-xs text-muted-foreground/60 sm:inline">
            {formatCount(stats.products)} 产品 · {formatCount(stats.categories)} 分类
          </span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <span className="font-data text-xs text-muted-foreground/60">
            &copy; <CopyrightYear />
          </span>
        </div>
      </div>
    </footer>
  )
}
