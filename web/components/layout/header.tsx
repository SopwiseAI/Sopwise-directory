"use client"

import { useState } from "react"
import Link from "next/link"
import { Search, Settings } from "lucide-react"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import ThemeToggle from "./theme-toggle"
import { Wordmark } from "@/components/brand/wordmark"

/** 读取初始查询：仅在用户展开搜索框（客户端）时调用，避免 useSearchParams 使整条 header 退化为客户端渲染 */
function initialQuery(): string {
  if (typeof window === "undefined") return ""
  return new URLSearchParams(window.location.search).get("q") ?? ""
}

/**
 * 移动端搜索：展开后为受控输入框，失焦或按 Esc 收起（无独立关闭按钮，节省窄屏空间）。
 * 有内容时按 Esc 先清空，再次 Esc 才收起——与常见命令栏一致。
 */
function MobileSearchInput({ onClose }: { onClose: () => void }) {
  const [value, setValue] = useState(initialQuery)
  const router = useRouter()

  const handleSearch = () => {
    const trimmed = value.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    } else if (e.key === "Escape") {
      if (value) setValue("")
      else onClose()
    }
  }

  return (
    <InputGroup className="w-full">
      <InputGroupAddon>
        <Search className="text-muted-foreground/60" />
      </InputGroupAddon>
      <InputGroupInput
        autoFocus
        type="search"
        enterKeyHint="search"
        aria-label="搜索 AI 产品"
        autoComplete="off"
        placeholder="搜索 AI 产品…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={onClose}
      />
    </InputGroup>
  )
}

function HeaderInner({ className }: { className?: string }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchResetKey, setSearchResetKey] = useState(0)

  const handleSearchClose = () => {
    setSearchOpen(false)
    setSearchResetKey((k) => k + 1)
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          aria-label="XiGee.net 首页"
          className="shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Wordmark size="md" />
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2">
          {searchOpen ? (
            <div id="mobile-search" className="w-full">
              <MobileSearchInput key={searchResetKey} onClose={handleSearchClose} />
            </div>
          ) : (
            <button
              type="button"
              aria-label="搜索产品"
              title="搜索"
              aria-expanded={false}
              aria-controls="mobile-search"
              onClick={() => setSearchOpen(true)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-4" />
            </button>
          )}

          <Link
            href="/settings"
            aria-label="设置"
            title="设置"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Settings className="size-4" />
          </Link>

          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export default function Header({ className }: { className?: string }) {
  return <HeaderInner className={className} />
}
