"use client"

import { useSyncExternalStore, useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid, History, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/layout/brand-mark"
import { PanelIcon } from "@/components/layout/panel-icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { categoryIconNode } from "@/lib/category-icon-node"
import { HistoryCount } from "@/components/history/history-count"
import { getAllCategories, getProductsByCategory } from "@/lib/data"
import { formatCount } from "@/lib/format"

const categories = getAllCategories()
const STORAGE_KEY = "xigee:sidebar-collapsed"
const TOTAL_PRODUCTS = categories.reduce((sum, c) => sum + getProductsByCategory(c.id).length, 0)

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
  window.addEventListener("storage", handler)
  return () => window.removeEventListener("storage", handler)
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
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }))
}

/** 折叠态品牌竖轨：居中品牌方块即"打开侧边栏"按钮。
    方块常驻，hover 时方块内浮现实心 panel 图标（对齐 DSH railMark 交互）。 */
function BrandRailToggle() {
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggle = () => toggleCollapsed(collapsed)

  return (
    <Button
      variant="ghost"
      size="icon-lg"
      onClick={toggle}
      aria-label="打开侧边栏"
      title="打开侧边栏"
      className="group mx-auto rounded-lg p-0"
    >
      <span className="relative">
        <BrandMark size="md" />
        {/* hover 时方块内换成实心 panel 图标 */}
        <span
          aria-hidden
          className="absolute inset-0 hidden items-center justify-center rounded-lg bg-sidebar group-hover:flex"
        >
          <PanelIcon className="size-4.5 text-primary" />
        </span>
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
      onClick={toggle}
      aria-label="收起侧边栏"
      title="收起侧边栏"
      className="-mr-1 shrink-0 rounded-full text-muted-foreground/70 transition-colors hover:bg-foreground/5 hover:text-foreground"
    >
      <PanelIcon className="size-4" />
    </Button>
  )
}

export function CategorySidebar() {
  const pathname = usePathname()
  const collapsed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const navRef = useRef<HTMLElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const [scrollable, setScrollable] = useState(false)

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
        "hidden shrink-0 flex-col border-r bg-sidebar md:flex",
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
              className="flex min-w-0 items-center gap-2.5 rounded-lg px-1 py-1.5 transition-colors hover:bg-secondary/60"
              title="XiGee 首页"
            >
              <BrandMark size="lg" />
              <span className="text-2xl font-semibold tracking-tight">XiGee</span>
            </Link>
            <CollapseToggle />
          </>
        )}
      </div>

      {/* 主导航区：占满剩余空间，可滚动 */}
      <div className="relative min-h-0 flex-1">
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
            count={formatCount(TOTAL_PRODUCTS)}
          />

          {/* 历史记录（辅助入口） */}
          <SidebarLink
            href="/history"
            active={pathname === "/history"}
            collapsed={collapsed}
            label="历史记录"
            icon={<History className="size-4 shrink-0" />}
            badge={<HistoryCount />}
          />

          <p className={cn("px-3 pb-1.5 pt-4 font-data text-muted-foreground", collapsed && "sr-only")}>分类</p>
          {categories.map(category => (
            <SidebarLink
              key={category.id}
              href={`/category/${category.id}`}
              active={pathname === `/category/${category.id}`}
              collapsed={collapsed}
              label={category.name}
              icon={categoryIconNode(category.id)}
              count={formatCount(getProductsByCategory(category.id).length)}
            />
          ))}
          <div ref={sentinelRef} className="h-px" />
        </nav>
        {scrollable && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-sidebar to-transparent" />
        )}
      </div>

      {/* 底部工具区：固定收拢，仅设置入口 */}
      <div className="flex shrink-0 flex-col p-2.5 pt-1.5">
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
  badge?: ReactNode
}

function SidebarLink({ href, active, collapsed, label, icon, count, badge }: SidebarLinkProps) {
  const link = (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-md py-1.5 pl-3 pr-2 text-[15px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0 py-2.5 [&_svg]:size-5",
        active
          ? "bg-secondary font-medium text-accent-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
      )}
    >
      {/* 活跃指示条 */}
      <span
        aria-hidden
        className={cn(
          "absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary transition-opacity",
          active ? "opacity-100" : "opacity-0"
        )}
      />
      {icon}
      <span className={cn("min-w-0 flex-1 truncate", collapsed && "sr-only")}>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "font-data tabular-nums transition-colors",
            collapsed ? "sr-only" : active ? "text-accent-foreground/70" : "text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
      {badge && <span className={cn(collapsed && "sr-only")}>{badge}</span>}
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
