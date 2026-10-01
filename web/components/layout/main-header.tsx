"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

/**
 * DSH 式主区搜索框：全站按 `/` 聚焦（非输入态），Enter 跳转 /search?q=…。
 * 放在主区顶栏右侧，取代原先横跨整行的搜索条。
 */
function SearchField({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
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

  const handleSearch = () => {
    const trimmed = value.trim()
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
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch()
          if (e.key === "Escape") {
            if (value) {
              setValue("")
              setFade(true)
              if (fadeTimer.current !== null) window.clearTimeout(fadeTimer.current)
              fadeTimer.current = window.setTimeout(() => setFade(false), 200)
            } else {
              inputRef.current?.blur()
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

/** 用 key 随 URL query 重挂载 SearchField，避免在 effect 中同步 setState。 */
function SearchWithParams() {
  const searchParams = useSearchParams()
  const q = searchParams.get("q") ?? ""
  return <SearchField key={q} defaultValue={q} />
}

function resolveCrumbs(pathname: string, categories: readonly Category[]): string[] {
  if (pathname.startsWith("/category/")) {
    const id = pathname.slice("/category/".length)
    const name = categories.find((c) => c.id === id)?.name
    return name ? ["全部产品", name] : ["全部产品"]
  }
  if (pathname === "/search") return ["搜索"]
  if (pathname === "/history") return ["历史记录"]
  if (pathname === "/settings") return ["设置"]
  return ["全部产品"]
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
      <nav aria-label="面包屑" className="min-w-0 flex-1 truncate text-sm text-muted-foreground">
        {crumbs.map((seg, i) => (
          <span key={seg}>
            {i > 0 && <span className="mx-1.5 text-muted-foreground/50">/</span>}
            <span className={i === crumbs.length - 1 ? "font-medium text-foreground" : undefined}>{seg}</span>
          </span>
        ))}
      </nav>
      <Suspense fallback={<div className="h-9 w-full max-w-xs rounded-md border border-border bg-secondary/70" />}>
        <SearchWithParams />
      </Suspense>
    </header>
  )
}
