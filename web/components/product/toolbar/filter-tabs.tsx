"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { TabMode } from "@/lib/product-query"

export const PRODUCT_TABS = [
  { key: "all", label: "全部" },
  { key: "latest", label: "最新" },
  { key: "featured", label: "精选" }
] as const satisfies readonly { key: TabMode; label: string }[]

interface FilterTabsProps {
  tab: TabMode
  onTabChange: (tab: TabMode) => void
}

/**
 * 产品筛选 tablist（全部 / 最新 / 精选），基于 shadcn Tabs。
 * 面板位于 ProductBrowser 中（跨子树），故显式保留 id / aria-controls 关联。
 */
export function FilterTabs({ tab, onTabChange }: FilterTabsProps) {
  return (
    <Tabs value={tab} onValueChange={(value) => onTabChange(value as TabMode)} className="w-fit">
      <TabsList variant="line" aria-label="产品筛选" activateOnFocus>
        {PRODUCT_TABS.map((t) => (
          <TabsTrigger key={t.key} value={t.key} id={`product-tab-${t.key}`} aria-controls="product-tabpanel">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
