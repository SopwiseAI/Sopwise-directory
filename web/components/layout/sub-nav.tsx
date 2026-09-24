"use client"

import { useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getAllCategories, getProductsByCategory } from "@/lib/data"
import { formatCount } from "@/lib/format"

const categories = getAllCategories()

export function SubNav({ className }: { className?: string }) {
  const pathname = usePathname()

  useEffect(() => {
    const el = document.querySelector('[aria-current="page"]')
    if (el) {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
    }
  }, [pathname])

  return (
    <nav
      className={cn(
        "sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2 pr-8">
          <Link
            href="/"
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname === "/"
                ? "bg-brand/10 font-medium text-brand"
                : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
            )}
          >
            全部
          </Link>
          {categories.map(category => {
            const isActive = pathname === `/category/${category.id}`
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
                )}
              >
                {category.name}
                <span className="font-data text-muted-foreground">
                  {formatCount(getProductsByCategory(category.id).length)}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="pointer-events-none absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent sm:right-6" />
      </div>
    </nav>
  )
}
