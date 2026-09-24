# Category Sidebar (App-Shell) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the in-content sidebar (Task1/Task2, now superseded) with a full-height full-bleed app-shell left rail (Codex/DeepSeek style) on desktop, keeping the top Header + horizontal SubNav on mobile.

**Architecture:** Rewrite `category-sidebar.tsx` into a full-height rail (brand top + collapse + nav + theme bottom), add a desktop content-area search bar, give `Header` a `className` prop, and restructure `layout.tsx` into an app-shell. Mobile chrome (Header + SubNav) stays via `md:hidden`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, shadcn/ui (base-ui Button/Input), lucide-react.

**Design doc:** `docs/plans/2026-08-28-category-sidebar-design.md`

**Current branch state:** `feat/adjust-category-display`. Prior commits already added `components/category/category-sidebar.tsx` (with `useSyncExternalStore` collapse logic + `SidebarLink` — KEEP these) and wired `SubNav` to `md:hidden` + a centered-container layout in `app/layout.tsx` (this layout will be OVERWRITTEN by R-Task3). Do NOT amend old commits; build new commits on top.

**Verification note:** No test framework (no `test` script). Per YAGNI do NOT introduce one. Verify = `pnpm lint` + `pnpm build` (SSG) + manual `pnpm dev`. TDD adapted to "verify after each change".

**Next.js 16 note (per AGENTS.md):** Uses only stable client APIs (`useState`/`useSyncExternalStore`/`usePathname`/`useSearchParams`) + JSX/CSS. No `params`/data-fetching changes. Consult `node_modules/next/dist/docs/` if a Next-specific question arises.

---

### R-Task 1: Rewrite CategorySidebar into full-height rail

**Files:**
- Modify: `components/category/category-sidebar.tsx` (rewrite the shell; KEEP the existing `useSyncExternalStore` collapse logic + `SidebarLink`)

**Step 1: Rewrite the file**

Keep the imports/state/toggle logic from the existing file, but restructure the JSX into a full-height rail with brand + collapse button + nav + theme toggle. Target file content:

```tsx
"use client"

import { useSyncExternalStore, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CategoryIcon } from "@/components/category/category-icon"
import ThemeToggle from "@/components/layout/theme-toggle"
import { cn } from "@/lib/utils"
import { getAllCategories } from "@/lib/data"

const categories = getAllCategories()
const STORAGE_KEY = "ailulu:sidebar-collapsed"

function getSnapshot() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function getServerSnapshot() {
  return false
}

function subscribe(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
}

export function CategorySidebar() {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = () => {
    const next = !collapsed
    try {
      localStorage.setItem(STORAGE_KEY, String(next))
    } catch {
      return
    }
    window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
  }

  const CollapseIcon = collapsed ? PanelLeftOpen : PanelLeftClose

  return (
    <aside
      aria-label="分类"
      id="category-sidebar"
      className={cn(
        "sticky top-0 hidden h-[100dvh] shrink-0 flex-col border-r bg-background md:flex",
        collapsed ? "w-14" : "w-52",
        "transition-[width] duration-200"
      )}
    >
      <div className={cn("flex h-14 shrink-0 items-center border-b px-2", collapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className={cn("text-xl font-bold tracking-tight", collapsed && "sr-only")}>ailulu</Link>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-controls="category-sidebar"
          title={collapsed ? "展开侧栏" : "收起侧栏"}
        >
          <CollapseIcon className="size-4" />
        </Button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        <SidebarLink
          href="/"
          active={pathname === "/"}
          collapsed={collapsed}
          label="全部"
          icon={<LayoutGrid className="size-4 shrink-0" />}
        />
        {categories.map((category) => (
          <SidebarLink
            key={category.id}
            href={`/category/${category.id}`}
            active={pathname === `/category/${category.id}`}
            collapsed={collapsed}
            label={category.name}
            icon={<CategoryIcon iconName={category.icon} className="size-4 shrink-0" />}
          />
        ))}
      </nav>

      <div className={cn("flex shrink-0 items-center border-t p-2", collapsed ? "justify-center" : "justify-start")}>
        <ThemeToggle />
      </div>
    </aside>
  )
}

interface SidebarLinkProps {
  href: string
  active: boolean
  collapsed: boolean
  label: string
  icon: ReactNode
}

function SidebarLink({ href, active, collapsed, label, icon }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-2 text-sm transition-colors",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      <span className={cn("truncate", collapsed && "sr-only")}>{label}</span>
    </Link>
  )
}
```

Key changes vs prior version: container is now `<aside>` with `sticky top-0 h-[100dvh] flex-col` (full-height, full-bleed, NOT inside centered container); brand row `h-14` at top; nav is `flex-1 min-h-0 overflow-y-auto`; theme toggle pinned to bottom with `border-t`. `SidebarLink` unchanged. Empty catch blocks keep real statements (no comments). No comments anywhere.

**Step 2: Lint**

Run: `pnpm lint` (from `/Users/Coder/zhycn/ailulu`). Expected: no errors. If `react-hooks`/`@typescript-eslint` flags something real, fix without changing behavior/structure.

**Step 3: Commit**

```bash
git add components/category/category-sidebar.tsx
git commit -m "feat: rewrite CategorySidebar as full-height app-shell rail with brand + theme"
```

---

### R-Task 2: Header className prop + new ContentSearchBar

**Files:**
- Modify: `components/layout/header.tsx` (accept `className`, thread to `<header>`, merge via `cn`)
- Create: `components/layout/content-search-bar.tsx`

**Step 1: Add className to Header**

In `components/layout/header.tsx`: the default export `Header` currently takes no props and returns `<Suspense><HeaderInner/></Suspense>`. Thread an optional `className` from `Header` → `HeaderInner` → the `<header>` element, merged with `cn` (import `cn` from `@/lib/utils`).

- `HeaderInner({ className }: { className?: string })` and `<header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>`.
- `Header({ className }: { className?: string })` returns `<Suspense><HeaderInner className={className} /></Suspense>`.

Leave all search/theme logic inside `HeaderInner` unchanged. Match the file's existing style (semicolons, double quotes).

**Step 2: Create ContentSearchBar**

Create `components/layout/content-search-bar.tsx`. It is the desktop content-area search bar. Full content:

```tsx
"use client"

import { Suspense, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useRouter, useSearchParams } from "next/navigation"

function SearchInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue)
  const router = useRouter()

  const handleSearch = () => {
    const trimmed = value.trim()
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch()
  }

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="搜索 AI 产品..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        className="h-9 pl-9 pr-3 text-sm"
      />
    </div>
  )
}

function ContentSearchBarInner({ defaultValue }: { defaultValue: string }) {
  return (
    <div className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:block">
      <div className="mx-auto w-full max-w-6xl px-4 py-2 sm:px-6">
        <SearchInput key={defaultValue} defaultValue={defaultValue} />
      </div>
    </div>
  )
}

export function ContentSearchBar() {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get("q") ?? ""
  return (
    <Suspense fallback={<ContentSearchBarInner defaultValue="" />}>
      <ContentSearchBarInner defaultValue={urlQuery} />
    </Suspense>
  )
}
```

Notes: `useSearchParams` requires a Suspense boundary during SSG — the `Suspense` + fallback pattern keeps build green. The `key={defaultValue}` remounts the input when the URL query changes (mirrors `header.tsx`'s pattern). Root is `hidden md:block sticky top-0`. No comments.

Wait — `useSearchParams` must be called inside the component wrapped by Suspense, not at the top of `ContentSearchBar` (which is outside Suspense). Restructure so the `useSearchParams` call is inside the Suspense boundary:

```tsx
export function ContentSearchBar() {
  return (
    <Suspense fallback={<ContentSearchBarInner defaultValue="" />}>
      <ContentSearchBarInner />
    </Suspense>
  )
}
```
and `ContentSearchBarInner` calls `useSearchParams()` itself and reads `q`. Adjust the code above accordingly: `ContentSearchBarInner()` (no props) reads `const searchParams = useSearchParams(); const urlQuery = searchParams.get("q") ?? ""` and renders the root `<div>` + `<SearchInput key={urlQuery} defaultValue={urlQuery} />`. The fallback must be a plain `div` (no `useSearchParams`) — use `<div className="sticky top-0 z-40 hidden border-b md:block" />` as fallback to avoid hook calls. Implement it this way.

**Step 3: Lint**

Run: `pnpm lint`. Expected: no errors.

**Step 4: Commit**

```bash
git add components/layout/header.tsx components/layout/content-search-bar.tsx
git commit -m "feat: add Header className prop and desktop ContentSearchBar"
```

---

### R-Task 3: Rewrite layout.tsx to app-shell

**Files:**
- Modify: `app/layout.tsx`

**Step 1: Rewrite the body block**

Current `app/layout.tsx` (after Task2) imports `Header`, `SubNav`, `Footer`, `CategorySidebar`, and the body is:

```tsx
      <body className="min-h-full flex flex-col">
        <Header />
        <SubNav className="md:hidden" />
        <div className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6">
          <div className="flex gap-6 py-6">
            <CategorySidebar />
            <main className="flex-1 min-w-0">{children}</main>
          </div>
        </div>
        <Footer />
```

Replace the imports + body. Add the `ContentSearchBar` import right after the `CategorySidebar` import:

```tsx
import { CategorySidebar } from "@/components/category/category-sidebar";
import { ContentSearchBar } from "@/components/layout/content-search-bar";
```

New body (keep `<body className="min-h-full flex flex-col">` and `<Footer />`):

```tsx
        <Header className="md:hidden" />
        <SubNav className="md:hidden" />
        <div className="flex flex-1">
          <CategorySidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <ContentSearchBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
          </div>
        </div>
        <Footer />
```

Why each piece:
- `Header className="md:hidden"` — mobile-only top chrome (brand+search+theme); desktop hides it (rail + content search bar take over).
- `SubNav className="md:hidden"` — mobile horizontal categories (already set; unchanged).
- outer `div.flex.flex-1` — desktop row (rail | content); on mobile rail is hidden so it collapses to just the content column.
- `CategorySidebar` — `hidden md:flex`, `sticky top-0 h-[100dvh]`, full-bleed left.
- content column `flex min-w-0 flex-1 flex-col` — holds the desktop search bar + main; `min-w-0` prevents overflow.
- `ContentSearchBar` — `hidden md:block sticky top-0` desktop search; hidden on mobile (Header provides search).
- `main` — `flex-1` to push footer down; `max-w-6xl mx-auto` centered within content column; `px-4 py-6 sm:px-6` preserves spacing.
- `Footer` full-width at bottom.

**Step 2: Lint + build**

Run: `pnpm lint` (expected: clean). Run: `pnpm build` (expected: SSG succeeds, ~27 pages incl `/` and 20 `/category/[id]`; a pre-existing `metadataBase` warning is acceptable).

**Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: restructure layout into desktop app-shell (rail + content search bar)"
```

---

### R-Task 4: Verify collapse, persistence, a11y, dark mode, responsive, desktop search

**Files:** none (verification + minor polish; edit only if a defect is found)

**Step 1: Manual verify (desktop, ≥768px) with `pnpm dev`**

- Full-height rail pinned to left edge, top:0 to bottom of viewport; brand "ailulu" at top; 20 categories + "全部" in nav; theme toggle at bottom.
- No global top Header on desktop (brand/theme in rail).
- Desktop content search bar sticky at top of content area; typing + Enter navigates to `/search?q=…`; URL query syncs the input.
- Collapse: click toggle → rail animates `w-52`→`w-14`; brand sr-only; labels sr-only + `title` tooltips; theme button centered. Expand reverses.
- Collapse, reload → stays collapsed (localStorage `ailulu:sidebar-collapsed`). Expand, reload → stays expanded.
- Active category highlighted on its `/category/[id]` page; rail stays in view while content scrolls.
- Dark mode: rail/search bar legible in both themes.
- No horizontal page overflow.

**Step 2: Manual verify (mobile, <768px)**

- Rail hidden; top Header (brand+search+theme) + horizontal SubNav present and sticky; mobile search button works. No desktop search bar. Layout unchanged from before this feature.

**Step 3: Lint + build final**

Run: `pnpm lint && pnpm build`. Expected: both pass.

**Step 4: Commit (only if polish applied)**

```bash
git add -A && git commit -m "fix: app-shell polish"
```
Skip if nothing changed.

---

## Out of scope (do NOT do)

- Do not touch `data/data.json`, `page.tsx`, `category/[id]/page.tsx`, Footer, SubNav internals, ThemeToggle internals, search page.
- Do not add a test framework.
- Do not widen content beyond `max-w-6xl` (revisit later).
- Do not extract a shared `SearchInput` now (the Header/ContentSearchBar duplication is acceptable; track as future refactor).
- Do not implement the zero-flash inline-script upgrade.
