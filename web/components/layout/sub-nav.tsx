"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { getAllCategories, getProductsByCategory } from "@/lib/data"
import { formatCount } from "@/lib/format"

const categories = getAllCategories()

export function SubNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav className={cn("sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2 pr-8">
          <Link
            href="/"
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname === "/"
                ? "bg-primary/10 font-medium text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            全部
          </Link>
          {categories.map((category) => {
            const isActive = pathname === `/category/${category.id}`
            return (
              <Link
                key={category.id}
                href={`/category/${category.id}`}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-primary/10 font-medium text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {category.name}
                <span className="font-data text-muted-foreground">{formatCount(getProductsByCategory(category.id).length)}</span>
              </Link>
            )
          })}
        </div>
        <div className="pointer-events-none absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-card to-transparent sm:right-6" />
      </div>
    </nav>
  )
}