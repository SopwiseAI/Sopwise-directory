"use client"

import type { LucideIcon } from "lucide-react"
import { ArrowDownAZ, ArrowUpZA, Clock, LayoutGrid, List, Star } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { setSort, setTab, setView } from "@/lib/preferences"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

interface Option<T extends string> {
  value: T
  label: string
  icon: LucideIcon
}

const VIEW_OPTIONS: Option<ViewMode>[] = [
  { value: "grid", label: "宫格", icon: LayoutGrid },
  { value: "list", label: "列表", icon: List }
]

const SORT_OPTIONS: Option<SortMode>[] = [
  { value: "latest", label: "最新", icon: Clock },
  { value: "name-asc", label: "名称 A-Z", icon: ArrowDownAZ },
  { value: "name-desc", label: "名称 Z-A", icon: ArrowUpZA }
]

const TAB_OPTIONS: Option<TabMode>[] = [
  { value: "all", label: "全部", icon: LayoutGrid },
  { value: "latest", label: "最新", icon: Clock },
  { value: "featured", label: "精选", icon: Star }
]

function PrefGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange
}: {
  label: string
  hint: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-0.5">
        <p className="text-xs font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <ToggleGroup
        value={[value]}
        onValueChange={(next) => {
          if (next[0]) onChange(next[0] as T)
        }}
        aria-label={label}
        className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
          <ToggleGroupItem
            key={optionValue}
            value={optionValue}
            variant="outline"
            aria-label={optionLabel}
            className="h-auto flex-col gap-1.5 py-3 text-xs text-muted-foreground data-[pressed]:border-ring data-[pressed]:text-foreground"
          >
            <Icon className="size-5" aria-hidden />
            {optionLabel}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

interface BrowsePreferencesProps {
  view: ViewMode
  sort: SortMode
  tab: TabMode
  /** 挂载前渲染同构骨架：偏好仅存于客户端，避免首帧显示默认选中后跳变。 */
  mounted: boolean
}

function BrowsePreferencesSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {[0, 1, 2].map((group) => (
        <div key={group} className="space-y-2">
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <Skeleton key={item} className="h-[66px] rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/** 浏览偏好：默认视图 / 排序 / Tab，与产品页共用同一份本地偏好。 */
export function BrowsePreferences({ view, sort, tab, mounted }: BrowsePreferencesProps) {
  if (!mounted) return <BrowsePreferencesSkeleton />

  return (
    <div className="space-y-5">
      <PrefGroup
        label="默认视图"
        hint="打开产品列表时使用的布局"
        options={VIEW_OPTIONS}
        value={view}
        onChange={setView}
      />
      <PrefGroup
        label="默认排序"
        hint="产品列表的默认排序方式"
        options={SORT_OPTIONS}
        value={sort}
        onChange={setSort}
      />
      <PrefGroup label="默认 Tab" hint="首页默认展示的产品范围" options={TAB_OPTIONS} value={tab} onChange={setTab} />
      <p className="text-xs text-muted-foreground/80">URL 参数（如 ?view=list）优先于这里的默认值。</p>
    </div>
  )
}
