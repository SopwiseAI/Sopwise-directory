"use client"

import { Suspense, useEffect, useRef, useState, type RefObject } from "react"
import Link from "next/link"
import { Search } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import type { Category } from "@/lib/types"

/**
 * 查询回填：隔离在 Suspense 内读取 useSearchParams，使输入框本身仍可 SSR（不随查询串退化为客户端渲染）；
 * 依赖 query 而非 pathname，覆盖「同路径仅查询串变化」（如点击推荐词）。
 */
function QuerySync({ inputRef }: { inputRef: RefObject<HTMLInputElement | null> }) {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  useEffect(() => {
    const el = inputRef.current
    if (el && el.value !== query) el.value = query
  }, [inputRef, query])

  return null
}

/**
 * DSH 式主区搜索框：全站按 `/` 聚焦（非输入态），Enter 跳转 /search?q=…。
 * 输入框为非受控，URL 查询经 QuerySync 回填。
 */
function SearchField() {
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
    const trimmed = inputRef.current?.value.trim() ?? ""
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  return (
    <InputGroup className={cn("group w-full max-w-xs", fade && "opacity-50")}>
      <Suspense fallback={null}>
        <QuerySync inputRef={inputRef} />
      </Suspense>
      <InputGroupAddon>
        <Search className="text-muted-foreground/60 transition-colors group-focus-within:text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
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
      />
      <InputGroupAddon align="inline-end">
        <span className="kbd" aria-hidden>
          /
        </span>
      </InputGroupAddon>
    </InputGroup>
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
  if (pathname === "/about") return [{ label: "关于" }]
  if (pathname === "/privacy") return [{ label: "隐私政策" }]
  if (pathname === "/terms") return [{ label: "服务条款" }]
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
                  <span aria-current={isLast ? "page" : undefined} className="truncate font-medium text-foreground">
                    {crumb.label}
                  </span>
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
