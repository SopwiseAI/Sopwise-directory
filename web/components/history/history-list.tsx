"use client"

import { useCallback, useEffect, useMemo, useReducer, useState, useSyncExternalStore, useRef } from "react"
import Link from "next/link"
import { Clock, Search, Trash2 } from "lucide-react"
import {
  clearHistory,
  getHistorySnapshot,
  groupHistoryByPeriod,
  parseHistorySnapshot,
  removeFromHistory,
  subscribeHistory
} from "@/lib/history"
import { formatCount } from "@/lib/format"
import { PricingBadge } from "@/components/product/pricing-badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import type { Category } from "@/lib/types"

/** 分页步长：初始渲染 + 每次触底加载的条数（避免 200 条一次性渲染） */
const PAGE_SIZE = 30

const noopSubscribe = () => () => {}
const mountedSnapshot = () => true
const notMountedSnapshot = () => false

/**
 * 首帧骨架：历史数据只在客户端（localStorage）可得，SSR 无从渲染真实内容。
 * 若直接渲染空态会在刷新时闪现「暂无访问记录」再跳成列表（HG-01）。
 * 故挂载前渲染与真实卡片同构的骨架，既消除错误内容闪烁，又稳定布局高度。
 */
function HistorySkeleton() {
  return (
    <div className="overflow-hidden rounded-lg border bg-card" aria-hidden>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="h-8 min-w-0 flex-1 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-12 animate-pulse rounded bg-muted" />
        <div className="h-4 w-10 animate-pulse rounded bg-muted" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-md bg-muted" />
        </div>
      ))}
    </div>
  )
}

/** 相对时间：非法日期兜底，避免 "Invalid Date" 英文报错式文案（PG-13） */
function formatRelativeTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return "未知时间"
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return "刚刚"
  if (min < 60) return `${min} 分钟前`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} 小时前`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} 天前`
  return date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
}

interface HistoryListProps {
  categories: readonly Category[]
}

/** 历史记录列表：hover 统一、无限滚动分页、搜索过滤、单条删除与清空 */
export function HistoryList({ categories }: HistoryListProps) {
  // 相对时间每分钟刷新（PG-13）
  const [, forceTick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = window.setInterval(forceTick, 60_000)
    return () => window.clearInterval(id)
  }, [])

  // HG-01：挂载前渲染骨架，避免 SSR 空态（"暂无访问记录"）在刷新时闪现后跳变
  const mounted = useSyncExternalStore(noopSubscribe, mountedSnapshot, notMountedSnapshot)
  const raw = useSyncExternalStore(subscribeHistory, getHistorySnapshot, () => "[]")
  const [query, setQuery] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  // 分类名查找：需在使用（filtered）之前定义（TDZ 防护）
  const categoryName = useCallback((id: string) => categories.find((c) => c.id === id)?.name ?? "", [categories])

  const items = useMemo(() => parseHistorySnapshot(raw), [raw])

  // 搜索过滤（名称/域名/分类）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter((it) => {
      const name = (it.name ?? "").toLowerCase()
      const domain = (it.domain ?? "").toLowerCase()
      const cat = categoryName(it.categoryId).toLowerCase()
      return name.includes(q) || domain.includes(q) || cat.includes(q)
    })
  }, [items, query, categoryName])

  // 触底加载更多（无限滚动）
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((n) => Math.min(n + PAGE_SIZE, filtered.length))
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filtered.length, query])

  // visibleCount 可能超过当前 filtered 长度（存储变化时），slice 自动安全
  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length
  // 按访问时间分组（今天/昨天/本周/更早），仅对已加载部分分组
  const groups = groupHistoryByPeriod(visible)

  if (!mounted) return <HistorySkeleton />

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border bg-card py-14 text-center">
        <Clock className="size-8 text-muted-foreground/60" />
        <p className="text-sm text-muted-foreground">暂无访问记录</p>
        <p className="text-xs text-muted-foreground">浏览产品时自动记录，方便下次快速回到这里</p>
        <Link
          href="/"
          className="mt-1 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-secondary outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          去逛逛
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      {/* 工具条：搜索 + 计数 + 清空 */}
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60"
            aria-hidden
          />
          <input
            type="search"
            enterKeyHint="search"
            aria-label="搜索历史记录"
            autoComplete="off"
            placeholder="搜索历史记录…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setVisibleCount(PAGE_SIZE)
            }}
            className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          />
        </div>
        <span className="font-data text-muted-foreground">
          {query ? `${formatCount(filtered.length)} 条匹配` : `共 ${formatCount(filtered.length)} 条`}
        </span>
        <button
          type="button"
          onClick={() => setShowClearConfirm(true)}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          清空全部
        </button>
      </div>

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空所有历史记录？</AlertDialogTitle>
            <AlertDialogDescription>此操作不可恢复，共 {items.length} 条记录</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                clearHistory()
              }}
            >
              确定清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 搜索无结果 */}
      {query && filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <Search className="size-6 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">未找到与「{query}」匹配的记录</p>
        </div>
      ) : (
        <>
          {groups.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-1.5 font-data text-xs font-medium text-muted-foreground backdrop-blur">
                {group.label}
              </div>
              <ul>
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="group flex items-center gap-3 border-b border-border px-4 py-3 transition-colors last:border-b-0 hover:bg-secondary/40"
                  >
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-w-0 flex-1 items-center gap-2 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-medium">{item.name}</p>
                        <p className="truncate font-data text-muted-foreground">
                          {item.domain}
                          {item.categoryId && ` · ${categoryName(item.categoryId)}`}
                          {item.visitCount > 1 && ` · 访问 ${item.visitCount} 次`}
                        </p>
                      </div>
                      <span className="hidden shrink-0 font-data text-muted-foreground sm:inline">
                        {formatRelativeTime(item.lastVisitedAt)}
                      </span>
                      {item.pricing ? (
                        <span className="hidden shrink-0 md:inline">
                          <PricingBadge pricing={item.pricing} />
                        </span>
                      ) : null}
                    </a>
                    <button
                      type="button"
                      aria-label={`删除 ${item.name} 的历史记录`}
                      title="删除"
                      onClick={() => removeFromHistory(item.id)}
                      className="shrink-0 rounded-md p-2.5 text-muted-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* 触底哨兵：滚动到此处自动加载更多 */}
          {hasMore && (
            <div ref={sentinelRef} className="flex items-center justify-center border-t py-3">
              <span className="font-data text-muted-foreground/80">
                已加载 {formatCount(visible.length)} / {formatCount(filtered.length)} · 滚动加载更多
              </span>
            </div>
          )}
          {!hasMore && filtered.length > PAGE_SIZE && (
            <div className="border-t py-2 text-center font-data text-muted-foreground/60">
              已全部加载（{formatCount(filtered.length)} 条）
            </div>
          )}
        </>
      )}
    </div>
  )
}
