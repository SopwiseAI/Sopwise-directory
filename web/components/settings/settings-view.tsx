"use client"

import Link from "next/link"
import { useSyncExternalStore } from "react"
import { useMounted } from "@/hooks/use-mounted"
import { InfoLayout, type InfoSectionDef } from "@/components/info/info-shell"
import { ThemeSwitch } from "@/components/layout/theme-switch"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field"
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

const DOC_LINKS = [
  { href: "/about", label: "关于" },
  { href: "/privacy", label: "隐私政策" },
  { href: "/terms", label: "服务条款" }
]

function useBrowsePreferences(): { view: ViewMode; sort: SortMode; tab: TabMode } {
  const view = useSyncExternalStore(subscribePreferences, getView, () => null)
  const sort = useSyncExternalStore(subscribePreferences, getSort, () => null)
  const tab = useSyncExternalStore(subscribePreferences, getTab, () => null)
  return { view: view ?? DEFAULT_VIEW, sort: sort ?? DEFAULT_SORT, tab: tab ?? DEFAULT_TAB }
}

/**
 * 设置页编排：外观 / 浏览偏好 / 数据与隐私 / 关于与版本 / 快捷键。
 *
 * 每节都是一组 shadcn `Field`「标题+说明在左，控件在右」的行，节标题由 InfoLayout 放在
 * 左列 —— 全页不再有「卡片套控件」的两层方框；节内靠行距分隔，快捷键一节用发丝线。
 */
export function SettingsView({ version, stats }: SettingsViewProps) {
  const { view, sort, tab } = useBrowsePreferences()
  const mounted = useMounted()

  const sections: InfoSectionDef[] = [
    {
      id: "appearance",
      title: "外观",
      body: (
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>主题</FieldTitle>
              <FieldDescription>选择外观模式，跟随系统会自动适配深浅色。</FieldDescription>
            </FieldContent>
            {mounted ? <ThemeSwitch /> : <Skeleton className="h-8 w-56 rounded-lg" />}
          </Field>
        </FieldGroup>
      )
    },
    {
      id: "browsing",
      title: "浏览偏好",
      body: <BrowsePreferences view={view} sort={sort} tab={tab} mounted={mounted} />
    },
    {
      id: "data-privacy",
      title: "数据与隐私",
      body: <DataControls mounted={mounted} />
    },
    {
      id: "about",
      title: "关于与版本",
      body: (
        <FieldGroup>
          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>版本</FieldTitle>
              <FieldDescription>当前部署的 XiGee 版本号</FieldDescription>
            </FieldContent>
            <span className="font-data text-muted-foreground">v{version}</span>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>数据规模</FieldTitle>
              <FieldDescription>收录工具、分类与精选的实时数量</FieldDescription>
            </FieldContent>
            <div className="flex flex-wrap gap-x-8 gap-y-3 @2xl:grid @2xl:grid-cols-3 @2xl:gap-x-6">
              <StatItem label="工具" value={stats.products} size="lg" />
              <StatItem label="分类" value={stats.categories} size="lg" />
              <StatItem label="精选" value={stats.featured} size="lg" />
            </div>
          </Field>

          <Field orientation="responsive">
            <FieldContent>
              <FieldTitle>相关文档</FieldTitle>
              <FieldDescription>甄选理念、数据处理方式与使用条款</FieldDescription>
            </FieldContent>
            <div className="flex flex-wrap items-center gap-2">
              {DOC_LINKS.map(({ href, label }) => (
                <Button key={href} variant="outline" size="sm" render={<Link href={href} />}>
                  {label}
                </Button>
              ))}
            </div>
          </Field>
        </FieldGroup>
      )
    },
    {
      id: "shortcuts",
      title: "快捷键",
      body: <Shortcuts />
    }
  ]

  return <InfoLayout title="设置" description="外观、浏览偏好、数据与隐私、关于与版本、快捷键。" sections={sections} />
}
