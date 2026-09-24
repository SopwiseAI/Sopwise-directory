import Link from "next/link"
import { getAllProducts, getAllCategories } from "@/lib/data"
import { BrandMark } from "@/components/layout/brand-mark"
import { formatCount } from "@/lib/format"
import pkg from "@/package.json"

const totalProducts = getAllProducts().length
const totalCategories = getAllCategories().length
const appVersion = pkg.version

export default function Footer() {
  return (
    <footer className="mt-12 border-t">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-6 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2">
            <BrandMark size="sm" />
            <span className="text-sm font-semibold tracking-tight">
              XiGee<span className="text-xs font-normal text-muted-foreground">.net</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <span className="font-data text-xs text-muted-foreground/60">v{appVersion}</span>
          <span className="hidden text-xs text-muted-foreground/40 sm:inline">·</span>
          <span className="hidden font-data text-xs text-muted-foreground/60 sm:inline">
            {formatCount(totalProducts)} 产品 · {formatCount(totalCategories)} 分类
          </span>
          <span className="text-xs text-muted-foreground/40">·</span>
          <span className="font-data text-xs text-muted-foreground/60">&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
