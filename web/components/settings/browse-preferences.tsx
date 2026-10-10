"use client"

import { cn } from "@/lib/utils"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { setSort, setTab, setView } from "@/lib/preferences"
import { SORT_OPTIONS, TAB_OPTIONS, VIEW_OPTIONS, type ProductOption } from "@/lib/product-options"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

/**
 * 控件栅格列数：跟随「卡片容器宽度」（容器查询）而非视口 ——
 * 主区可用宽度会随侧栏折叠/展开变化，视口断点算不准这里该排几列。
 *
 * 列数与选项数对齐，让每组都把整行排满：宽屏下 4 个排序排一行（不再掉成 3+1 孤儿行），
 * 2 个视图占满两格（不留第 3 个空列），3 个 Tab 直接三等分。
 */
const GROUP_COLUMNS = {
  view: "grid-cols-2",
  sort: "grid-cols-2 @2xl:grid-cols-4",
  tab: "grid-cols-3"
} as const

function PrefGroup<T extends string>({
  label,
  hint,
  options,
  columns,
  value,
  onChange
}: {
  label: string
  hint: string
  options: readonly ProductOption<T>[]
  columns: string
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
        className={cn("grid w-full gap-2", columns)}
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

/** 骨架与真实控件同构：分组、列数、每格数量都对齐，挂载后不产生跳变。 */
const SKELETON_GROUPS = [
  { key: "view", count: VIEW_OPTIONS.length, columns: GROUP_COLUMNS.view },
  { key: "sort", count: SORT_OPTIONS.length, columns: GROUP_COLUMNS.sort },
  { key: "tab", count: TAB_OPTIONS.length, columns: GROUP_COLUMNS.tab }
] as const

function BrowsePreferencesSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      {SKELETON_GROUPS.map(({ key, count, columns }) => (
        <div key={key} className="space-y-2">
          <div className="space-y-1">
            <Skeleton className="h-3.5 w-16 rounded" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
          <div className={cn("grid gap-2", columns)}>
            {Array.from({ length: count }, (_, item) => (
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
        columns={GROUP_COLUMNS.view}
        value={view}
        onChange={setView}
      />
      <PrefGroup
        label="默认排序"
        hint="工具列表的默认排序方式"
        options={SORT_OPTIONS}
        columns={GROUP_COLUMNS.sort}
        value={sort}
        onChange={setSort}
      />
      <PrefGroup
        label="默认 Tab"
        hint="首页默认展示的工具范围"
        options={TAB_OPTIONS}
        columns={GROUP_COLUMNS.tab}
        value={tab}
        onChange={setTab}
      />
      <p className="text-xs text-muted-foreground/80">URL 参数（如 ?view=list）优先于这里的默认值。</p>
    </div>
  )
}
