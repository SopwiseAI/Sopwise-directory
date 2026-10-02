"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Info, Settings, ShieldCheck, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/settings", label: "设置", icon: Settings },
  { href: "/about", label: "关于", icon: Info },
  { href: "/privacy", label: "隐私政策", icon: ShieldCheck },
  { href: "/terms", label: "服务条款", icon: FileText }
]

/**
 * 信息区子导航：顶部水平排列，窄屏横向滚动。
 * 选中态沿用既有子导航语言（bg-brand/10 + 品牌色文字 + 左侧竖条），与全站一致。
 */
export function InfoNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label="信息导航" className={cn("no-scrollbar flex items-center gap-1 overflow-x-auto", className)}>
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="whitespace-nowrap">{label}</span>
            {active && <span className="sr-only">（当前页）</span>}
          </Link>
        )
      })}
    </nav>
  )
}
