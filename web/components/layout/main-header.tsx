"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

/**
 * DSH 式主区搜索框：全站按 `/` 聚焦（非输入态），Enter 跳转 /search?q=…。
 * 输入框为**非受控**且不依赖 useSearchParams，使其可被 SSR（避免首帧只剩骨架盒、占位符后补的闪烁）；
 * URL 查询经 pathname 变化时用 ref 回填，不触发 effect 内 setState。
 */
function SearchField() {
  const pathname = usePathname()
  const [fade, setFade] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const fadeTimer = useRef<number | null>(null)
  const router = useRouter()

  const isTypingTarget = (el: EventTarget | null) => {
    if (!(el instanceof HTMLElement)) return false
    const tag = el.tagName
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
    }
  }, [])

  // 从 URL 回填查询（客户端；不订阅 useSearchParams 以保 SSR）
  useEffect(() => {
    const el = inputRef.current
    if (el) el.value = new URLSearchParams(window.location.search).get("q") ?? ""
  }, [pathname])

  const handleSearch = () => {
    const trimmed = inputRef.current?.value.trim() ?? ""
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <div className="group relative w-full max-w-xs">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label="搜索 AI 产品"
        autoComplete="off"
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch()
          if (e.key === "Escape") {
            const el = inputRef.current
            if (el && el.value) {
              el.value = ""
              setFade(true)
              if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
              fadeTimer.current = window.setTimeout(() => setFade(false), 200)
            } else {
              el?.blur()
            }
          }
        }}
        placeholder="搜索 AI 产品…"
        className={cn(
          "h-9 w-full rounded-md border border-border bg-secondary/70 pl-9 pr-12 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:bg-background focus-visible:ring-2 focus-visible:ring-ring/30",
          fade && "opacity-50"
        )}
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden>
        <span className="kbd">/</span>
      </span>
    </div>
  )
}

interface Crumb {
  label: string
  href?: string
}

function resolveCrumbs(pathname: string, categories: readonly Category[]): Crumb[] {
  if (pathname.startsWith("/category/")) {
    const id = pathname.slice("/category/".length)
    const name = categories.find((c) => c.id === id)?.name
    return name ? [{ label: "全部产品", href: "/" }, { label: name }] : [{ label: "全部产品", href: "/" }]
  }
  if (pathname === "/search") return [{ label: "搜索" }]
  if (pathname === "/history") return [{ label: "历史记录" }]
  if (pathname === "/settings") return [{ label: "设置" }]
  return [{ label: "全部产品" }]
}

interface MainHeaderProps {
  className?: string
  categories: readonly Category[]
}

/** 主区顶栏：左侧路由面包屑，右侧搜索。 */
export function MainHeader({ className, categories }: MainHeaderProps) {
  const pathname = usePathname()
  const crumbs = resolveCrumbs(pathname, categories)

  return (
    <header className={cn("h-14 shrink-0 items-center gap-3 border-b border-sidebar-border px-4 sm:px-6", className)}>
      <nav aria-label="面包屑" className="flex min-w-0 flex-1 items-center text-sm text-muted-foreground">
        <ol className="flex min-w-0 items-center">
          {crumbs.map((crumb, i) => {
            const isLast = i === crumbs.length - 1
            return (
              <li key={i} className="flex min-w-0 items-center">
                {i > 0 && <span className="mx-1.5 text-muted-foreground/50">/</span>}
                {isLast || !crumb.href ? (
                  <span className="truncate font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="truncate transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <SearchField />
    </header>
  )
}
