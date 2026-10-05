"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { setSort, setTab, setView } from "@/lib/preferences"
import { SORT_OPTIONS, TAB_OPTIONS, VIEW_OPTIONS, type ProductOption } from "@/lib/product-options"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

function PrefGroup<T extends string>({
  label,
  hint,
  options,
  value,
  onChange
}: {
  label: string
  hint: string
  options: readonly ProductOption<T>[]
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
        hint="打开工具列表时使用的布局"
        options={VIEW_OPTIONS}
        value={view}
        onChange={setView}
      />
      <PrefGroup
        label="默认排序"
        hint="工具列表的默认排序方式"
        options={SORT_OPTIONS}
        value={sort}
        onChange={setSort}
      />
      <PrefGroup label="默认 Tab" hint="首页默认展示的工具范围" options={TAB_OPTIONS} value={tab} onChange={setTab} />
      <p className="text-xs text-muted-foreground/80">URL 参数（如 ?view=list）优先于这里的默认值。</p>
    </div>
  )
}
