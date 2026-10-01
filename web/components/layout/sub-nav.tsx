"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { Category } from "@/lib/types"

interface SubNavProps {
  className?: string
  categories: readonly Category[]
  categoryCounts: Record<string, number>
}

export function SubNav({ className, categories, categoryCounts }: SubNavProps) {
  const pathname = usePathname()
  const firstRun = useRef(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 仅在本导航容器内查找激活项：避免命中侧栏（移动端 display:none）的同名 aria-current 而空滚（SN-01）
  useEffect(() => {
    const el = scrollRef.current?.querySelector<HTMLElement>('[aria-current="page"]')
    if (el) {
      // 首次加载瞬时定位（避免首帧横向滑动闪烁），后续路由切换平滑滚动
      el.scrollIntoView({ behavior: firstRun.current ? "auto" : "smooth", inline: "center", block: "nearest" })
    }
    firstRun.current = false
  }, [pathname])

  return (
    <nav
      className={cn(
        "sticky top-14 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 relative">
        <div ref={scrollRef} className="no-scrollbar flex items-center gap-1 overflow-x-auto py-2 pr-8">
          <Link
            href="/"
            aria-current={pathname === "/" ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              pathname === "/"
                ? "bg-brand/10 font-medium text-brand"
                : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
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
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "bg-brand/10 font-medium text-brand"
                    : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
                )}
              >
                {category.name}
                <span className="font-data text-muted-foreground">{formatCount(categoryCounts[category.id] ?? 0)}</span>
              </Link>
            )
          })}
        </div>
        <div className="pointer-events-none absolute right-4 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent sm:right-6" />
      </div>
    </nav>
  )
}
