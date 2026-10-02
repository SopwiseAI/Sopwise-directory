"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const ITEMS = [
  { href: "/settings", label: "设置" },
  { href: "/about", label: "关于" },
  { href: "/privacy", label: "隐私" },
  { href: "/terms", label: "条款" }
] as const

/** 设置 / 关于 / 隐私 / 条款 之间的横向导航，四页共享，保证「一起」可达。 */
export function InfoNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="信息导航" className={cn("no-scrollbar flex items-center gap-1 overflow-x-auto", className)}>
      {ITEMS.map((item) => {
        const active = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
