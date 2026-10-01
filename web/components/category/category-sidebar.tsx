"use client"

import { useSyncExternalStore, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, History, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand/brand-mark"
import { Wordmark } from "@/components/brand/wordmark"
import { PanelIcon } from "@/components/brand/panel-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { categoryIconNode } from "@/lib/category-icon-node"
import { useHistoryCount } from "@/components/history/history-count"
import { formatCount } from "@/lib/format"
import type { Category } from "@/lib/types"

const STORAGE_KEY = "xigee:sidebar-collapsed"
const COLLAPSE_EVENT = "xigee:sidebar-collapse"

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
  const storageHandler = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return
    // 其他 tab 折叠变化时同步 data-sidebar，保持 CSS 引导一致（SB-01）
    try {
      const next = localStorage.getItem(STORAGE_KEY) === "true"
      document.documentElement.setAttribute("data-sidebar", next ? "collapsed" : "expanded")
    } catch {
      /* noop */
    }
    callback()
  }
  window.addEventListener("storage", storageHandler)
  window.addEventListener(COLLAPSE_EVENT, callback)
  return () => {
    window.removeEventListener("storage", storageHandler)
    window.removeEventListener(COLLAPSE_EVENT, callback)
  }
}

/** 切换折叠状态并同步 <html data-sidebar>（保持与首帧引导 CSS 双轨一致，SB-01） */
function toggleCollapsed(collapsed: boolean) {
  const next = !collapsed
  try {
    localStorage.setItem(STORAGE_KEY, String(next))
    document.documentElement.setAttribute("data-sidebar", next ? "collapsed" : "expanded")
  } catch {
    return
  }
  window.dispatchEvent(new Event(COLLAPSE_EVENT))
}

/** 折叠态品牌竖轨：居中品牌方块即"打开侧边栏"按钮。
    方块常驻，hover 时方块内浮现实心 panel 图标（对齐 DSH railMark 交互）。 */
function BrandRailToggle() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = () => toggleCollapsed(collapsed)

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label="打开侧边栏"
      title="打开侧边栏"
      className="group relative mx-auto size-8 shrink-0 overflow-hidden rounded-[9px] border-0 p-0 hover:bg-transparent dark:hover:bg-transparent"
    >
      {/* hover 时瓦片淡出、面板图标淡入 —— 单层渲染，避免两层圆角抗锯齿叠加出暗边 */}
      <BrandMark size="md" className="transition-opacity duration-150 group-hover:opacity-0" />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      >
        <PanelIcon className="size-4 text-primary" />
      </span>
    </Button>
  )
}

/** 展开态顶部收起按钮：28px 圆形 + 实心 panel 图标（对齐 DSH） */
function CollapseToggle() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = () => toggleCollapsed(collapsed)

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label="收起侧边栏"
      title="收起侧边栏"
      className="-mr-1 shrink-0 rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      <PanelIcon className="size-4" />
    </Button>
  )
}

interface CategorySidebarProps {
  categories: readonly Category[]
  categoryCounts: Record<string, number>
  totalProducts: number
}

export function CategorySidebar({ categories, categoryCounts, totalProducts }: CategorySidebarProps) {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const historyCount = useHistoryCount()
  const navRef = useRef<HTMLElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)

  // 标记 hydration 完成，关闭首帧引导 CSS（否则 display:none 会盖过 sr-only）
  // 用 useLayoutEffect 在 paint 前同步设置，消除无障碍盲窗
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-sidebar-hydrated", "")
  }, [])

  useEffect(() => {
    const nav = navRef.current
    const sentinel = sentinelRef.current
    if (!nav || !sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setScrollable(!entry.isIntersecting)
      },
      { root: nav, threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [collapsed])
  // 折叠态 tooltip 由 shadcn Tooltip 组件统一管理（Portal + 定位 + ARIA）

  return (
    <aside
      aria-label="分类导航"
      id="category-sidebar"
      className={cn(
        "hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex",
        collapsed ? "w-14" : "w-[280px]",
        "transition-[width] duration-200"
      )}
    >
      {/* 品牌区：折叠控制恒在品牌行（DSH 式）。
       展开态：mark + XiGee | 收起按钮。
       折叠态：整个品牌区即"打开侧边栏"按钮 —— 仅见 logo，hover LOGO 时浮现展开图标，点击展开。 */}
      <div className={cn("flex shrink-0 items-center", collapsed ? "pt-2" : "h-16 justify-between px-3")}>
        {collapsed ? (
          <BrandRailToggle />
        ) : (
          <>
            <Link
              href="/"
              className="flex min-w-0 items-center rounded-lg px-1 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="XiGee.net 首页"
            >
              <Wordmark size="lg" />
            </Link>
            <CollapseToggle />
          </>
        )}
      </div>

      {/* 主导航区：占满剩余空间，可滚动 */}
      <div className="relative flex-1 min-h-0">
        <nav
          ref={navRef}
          className={cn(
            "flex h-full flex-col overflow-y-auto",
            collapsed ? "gap-1.5 px-2.5 pt-3" : "gap-0.5 px-1.5 pt-1"
          )}
        >
          {/* 全部产品（核心主功能，首位） */}
          <SidebarLink
            href="/"
            active={pathname === "/"}
            collapsed={collapsed}
            label="全部产品"
            icon={<LayoutGrid className="size-4 shrink-0" />}
            count={formatCount(totalProducts)}
          />

          {/* 历史记录（辅助入口） */}
          <SidebarLink
            href="/history"
            active={pathname === "/history"}
            collapsed={collapsed}
            label="历史记录"
            icon={<History className="size-4 shrink-0" />}
            count={formatCount(historyCount)}
          />

          <Separator data-collapse-hide className={cn(collapsed && "sr-only")} />
          <p
            data-collapse-hide
            className={cn("px-3 pb-1.5 pt-3 font-data text-muted-foreground", collapsed && "sr-only")}
          >
            分类
          </p>
          {categories.map((category) => (
            <SidebarLink
              key={category.id}
              href={`/category/${category.id}`}
              active={pathname === `/category/${category.id}`}
              collapsed={collapsed}
              label={category.name}
              icon={categoryIconNode(category.icon)}
              count={formatCount(categoryCounts[category.id] ?? 0)}
            />
          ))}
          <div ref={sentinelRef} className="h-px" />
        </nav>
        {scrollable && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-sidebar to-transparent" />
        )}
      </div>

      {/* DSH 底部固定座：设置（与导航区解耦，导航滚动时保持可见） */}
      <div className="shrink-0 border-t border-sidebar-border p-1.5">
        <SidebarLink
          href="/settings"
          active={pathname === "/settings"}
          collapsed={collapsed}
          label="设置"
          icon={<Settings className="size-4 shrink-0" />}
        />
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
  count?: string
}

function SidebarLink({ href, active, collapsed, label, icon, count }: SidebarLinkProps) {
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-md py-1.5 pl-3 pr-2 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0 py-2.5 [&_svg]:size-5",
        active
          ? "bg-sidebar-accent font-medium text-foreground"
          : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground"
      )}
    >
      {/* 活跃指示条 */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-brand transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      {icon}
      <span data-collapse-hide className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>
        {label}
      </span>
      {count !== undefined && (
        <span
          data-collapse-hide
          data-sidebar-count
          className={cn(
            "font-data tabular-nums transition-colors",
            collapsed ? "sr-only" : active ? "text-sidebar-accent-foreground/70" : "text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </Link>
  )

  // 折叠态：用 shadcn Tooltip 提供右侧悬浮提示（Portal + 箭头 + 动画，规范实现）
  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger render={link} />
        <TooltipContent side="right" sideOffset={10} align="center" alignOffset={4}>
          {label}
          {count !== undefined && <span className="ml-1.5 font-data text-inherit opacity-70">{count}</span>}
        </TooltipContent>
      </Tooltip>
    )
  }

  return link
}
