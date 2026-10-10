"use client"

import { Suspense, useCallback, useEffect, useRef, useState, type RefObject } from "react"
import Link from "next/link"
import { Search, Settings, X } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"
import { Kbd } from "@/components/ui/kbd"
import ThemeToggle from "@/components/layout/theme-toggle"
import type { Category } from "@/lib/types"

/**
 * 查询回填：隔离在 Suspense 内读取 useSearchParams，使输入框本身仍可 SSR（不随查询串退化为客户端渲染）；
 * 依赖 query 而非 pathname，覆盖「同路径仅查询串变化」（如点击推荐词）。
 */
function QuerySync({
  inputRef,
  onQueryChange
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onQueryChange: (value: string) => void
}) {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") ?? ""

  useEffect(() => {
    const el = inputRef.current
    if (el && el.value !== query) el.value = query
    onQueryChange(query)
  }, [inputRef, query, onQueryChange])

  return null
}

/**
 * 主区顶栏搜索框：全站按 `/` 聚焦（非输入态），Enter 跳转 /search?q=…。
 * 输入框为非受控，失焦/清空时同步 URL（router.replace，不写历史）。
 */
function SearchField() {
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const [hasValue, setHasValue] = useState(false)

  const syncValueFlag = useCallback((value: string) => setHasValue(value.length > 0), [])

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
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  /** 提交搜索：仅在有内容时跳转，并采用 push 以保留「返回」语义 */
  const handleSearch = () => {
    const trimmed = inputRef.current?.value.trim() ?? ""
    if (!trimmed) return
    router.push(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  /** 清空输入并同步移除 URL 上的 q（replaceState 不写历史、不触发导航），保留其它查询参数 */
  const handleClear = () => {
    const el = inputRef.current
    if (!el) return
    el.value = ""
    setHasValue(false)
    const params = new URLSearchParams(window.location.search)
    if (params.has("q")) {
      params.delete("q")
      const qs = params.toString()
      window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname)
    }
    el.focus()
  }

  return (
    <InputGroup className="group w-full max-w-sm">
      <Suspense fallback={null}>
        <QuerySync inputRef={inputRef} onQueryChange={syncValueFlag} />
      </Suspense>
      <InputGroupAddon>
        <Search className="text-muted-foreground/60 transition-colors group-focus-within/input-group:text-muted-foreground" />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label="搜索 AI 工具"
        autoComplete="off"
        onChange={(e) => setHasValue(e.currentTarget.value.length > 0)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch()
          if (e.key === "Escape") {
            if (e.currentTarget.value) handleClear()
            else e.currentTarget.blur()
          }
        }}
        placeholder="搜索 AI 工具…"
      />
      <InputGroupAddon align="inline-end">
        {hasValue ? (
          <InputGroupButton
            size="icon-xs"
            aria-label="清除搜索"
            title="清除"
            className="text-muted-foreground hover:text-foreground"
            onClick={handleClear}
          >
            <X />
          </InputGroupButton>
        ) : (
          <Kbd aria-hidden>/</Kbd>
        )}
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
    return name ? [{ label: "全部工具", href: "/" }, { label: name }] : [{ label: "全部工具", href: "/" }]
  }
  if (pathname === "/search") return [{ label: "搜索" }]
  if (pathname === "/history") return [{ label: "历史记录" }]
  if (pathname === "/settings") return [{ label: "设置" }]
  if (pathname === "/about") return [{ label: "关于" }]
  if (pathname === "/privacy") return [{ label: "隐私政策" }]
  if (pathname === "/terms") return [{ label: "服务条款" }]
  return [{ label: "全部工具" }]
}

const iconButton =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"

interface MainHeaderProps {
  className?: string
  categories: readonly Category[]
}

/** 主区顶栏：左侧路由面包屑，右侧搜索 + 设置/主题入口。 */
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
      <Link href="/settings" aria-label="设置" title="设置" className={iconButton}>
        <Settings className="size-4" />
      </Link>
      <ThemeToggle />
    </header>
  )
}
