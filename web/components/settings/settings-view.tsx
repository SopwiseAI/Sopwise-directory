"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { useMounted } from "@/hooks/use-mounted"
import { InfoLayout, type InfoSectionDef } from "@/components/info/info-shell"
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

/** 主题卡片骨架：与 ThemeSwitch 的 3 列卡片同构，避免首帧选中态跳变。 */
function ThemeSwitchSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-2 @xl:grid-cols-3" aria-hidden>
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
  const mounted = useMounted()

  const sections: InfoSectionDef[] = [
    {
      id: "appearance",
      title: "外观",
      card: true,
      body: (
        <>
          <p className="text-xs text-muted-foreground">选择外观模式，跟随系统会自动适配深浅色。</p>
          {mounted ? <ThemeSwitch /> : <ThemeSwitchSkeleton />}
        </>
      )
    },
    {
      id: "browsing",
      title: "浏览偏好",
      card: true,
      body: <BrowsePreferences view={view} sort={sort} tab={tab} mounted={mounted} />
    },
    {
      id: "data-privacy",
      title: "数据与隐私",
      card: true,
      body: <DataControls mounted={mounted} />
    },
    {
      id: "about",
      title: "关于与版本",
      card: true,
      body: (
        // 宽卡片下切成「左：品牌与链接 / 右：数据规模」，两侧都占住，不把内容堆在左半边
        <div className="@3xl:grid @3xl:grid-cols-2 @3xl:items-start @3xl:gap-8">
          <div className="space-y-2">
            <div className="space-y-1">
              <p className="text-sm text-foreground">XiGee — 精选 AI 工具目录</p>
              <p className="text-xs text-muted-foreground">
                精选值得用的 AI 工具，每一款都经过人工筛选，从 XiGee 直达官方网站。
              </p>
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
          </div>
          <div className="@2xl:grid @2xl:grid-cols-3 @2xl:gap-4 flex flex-wrap gap-x-10 gap-y-4">
            <StatItem label="工具" value={stats.products} size="lg" />
            <StatItem label="分类" value={stats.categories} size="lg" />
            <StatItem label="精选" value={stats.featured} size="lg" />
          </div>
        </div>
      )
    },
    {
      id: "shortcuts",
      title: "快捷键",
      card: true,
      body: <Shortcuts />
    }
  ]

  return <InfoLayout title="设置" description="外观、浏览偏好、数据与隐私、关于与版本、快捷键。" sections={sections} />
}
