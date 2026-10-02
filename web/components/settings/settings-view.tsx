"use client"

import type { ReactNode } from "react"
import { useSyncExternalStore } from "react"
import Link from "next/link"
import { InfoLayout } from "@/components/info/info-shell"
import { ThemeSwitch } from "@/components/layout/theme-switch"
import { StatItem } from "@/components/ui/stat-item"
import { Skeleton } from "@/components/ui/skeleton"
import { BrowsePreferences } from "@/components/settings/browse-preferences"
import { DataControls } from "@/components/settings/data-controls"
import { Shortcuts } from "@/components/settings/shortcuts"
import {
  DEFAULT_SORT,
  DEFAULT_TAB,
  DEFAULT_VIEW,
  getSort,
  getTab,
  getView,
  subscribePreferences
} from "@/lib/preferences"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

interface SettingsViewProps {
  version: string
  stats: { products: number; categories: number; featured: number }
}

const noopSubscribe = () => () => {}
const mountedSnapshot = () => true
const notMountedSnapshot = () => false

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="relative pl-3 text-sm text-muted-foreground before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-brand/40">
        {title}
      </h2>
      <div className="space-y-3 rounded-lg border bg-card px-4 py-3.5">{children}</div>
    </section>
  )
}

/** 主题卡片骨架：与 ThemeSwitch 的 3 列卡片同构，避免首帧选中态跳变。 */
function ThemeSwitchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3" aria-hidden>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-[66px] rounded-lg" />
      ))}
    </div>
  )
}

function useBrowsePreferences(): { view: ViewMode; sort: SortMode; tab: TabMode } {
  const view = useSyncExternalStore(subscribePreferences, getView, () => null)
  const sort = useSyncExternalStore(subscribePreferences, getSort, () => null)
  const tab = useSyncExternalStore(subscribePreferences, getTab, () => null)
  return { view: view ?? DEFAULT_VIEW, sort: sort ?? DEFAULT_SORT, tab: tab ?? DEFAULT_TAB }
}

/** 设置页编排：外观 / 浏览偏好 / 数据与隐私 / 关于与版本 / 快捷键。 */
export function SettingsView({ version, stats }: SettingsViewProps) {
  const { view, sort, tab } = useBrowsePreferences()
  const mounted = useSyncExternalStore(noopSubscribe, mountedSnapshot, notMountedSnapshot)

  return (
    <InfoLayout title="设置" description="外观、浏览偏好、数据与隐私、关于与版本、快捷键。">
      <SettingsSection title="外观">
        <p className="text-xs text-muted-foreground">选择外观模式，跟随系统会自动适配深浅色。</p>
        {mounted ? <ThemeSwitch /> : <ThemeSwitchSkeleton />}
      </SettingsSection>

      <SettingsSection title="浏览偏好">
        <BrowsePreferences view={view} sort={sort} tab={tab} mounted={mounted} />
      </SettingsSection>

      <SettingsSection title="数据与隐私">
        <DataControls mounted={mounted} />
      </SettingsSection>

      <SettingsSection title="关于与版本">
        <div className="space-y-1">
          <p className="text-sm text-foreground">XiGee — 你的 AI 发现引擎</p>
          <p className="text-xs text-muted-foreground">
            发现和探索优秀的 AI 产品。数据驱动、纯静态构建，从 XiGee 直达官方网站。
          </p>
        </div>
        <div className="flex flex-wrap gap-x-10 gap-y-4">
          <StatItem label="产品" value={stats.products} size="lg" />
          <StatItem label="分类" value={stats.categories} size="lg" />
          <StatItem label="精选" value={stats.featured} size="lg" />
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span className="font-data text-muted-foreground/70">v{version}</span>
          <Link
            href="/about"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            关于
          </Link>
          <Link
            href="/privacy"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            隐私政策
          </Link>
          <Link
            href="/terms"
            className="text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
          >
            服务条款
          </Link>
        </div>
      </SettingsSection>

      <SettingsSection title="快捷键">
        <Shortcuts />
      </SettingsSection>
    </InfoLayout>
  )
}
