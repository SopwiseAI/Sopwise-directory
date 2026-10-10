"use client"

import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Skeleton } from "@/components/ui/skeleton"
import { setSort, setTab, setView } from "@/lib/preferences"
import { SORT_OPTIONS, TAB_OPTIONS, VIEW_OPTIONS, type ProductOption } from "@/lib/product-options"
import type { SortMode, TabMode, ViewMode } from "@/lib/product-query"

interface PrefFieldProps<T extends string> {
  label: string
  hint: string
  options: readonly ProductOption<T>[]
  /** 控件骨架宽度：偏好只存在客户端，挂载前用骨架占位，避免首帧选中态跳变 */
  skeletonWidth: string
  disabled?: boolean
  value: T
  onChange?: (value: T) => void
}

/**
 * 一行偏好设置：左侧标题+说明，右侧分段控件（`Field orientation="responsive"` 在窄容器里
 * 自动变成上下堆叠）。标签文案是静态的，挂载前也照常渲染，只把控件换成骨架，避免跳动。
 */
function PrefField<T extends string>({
  label,
  hint,
  options,
  skeletonWidth,
  disabled,
  value,
  onChange
}: PrefFieldProps<T>) {
  return (
    <Field orientation="responsive">
      <FieldContent>
        <FieldTitle>{label}</FieldTitle>
        <FieldDescription>{hint}</FieldDescription>
      </FieldContent>
      {disabled ? (
        <Skeleton className={`h-8 rounded-lg ${skeletonWidth}`} />
      ) : (
        <ToggleGroup
          value={[value]}
          onValueChange={(next) => {
            if (next[0]) onChange?.(next[0] as T)
          }}
          aria-label={label}
          variant="outline"
          spacing={0}
          className="w-fit"
        >
          {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
            <ToggleGroupItem key={optionValue} value={optionValue} className="gap-1.5">
              <Icon data-icon="inline-start" aria-hidden />
              {optionLabel}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}
    </Field>
  )
}

interface BrowsePreferencesProps {
  view: ViewMode
  sort: SortMode
  tab: TabMode
  /** 挂载前渲染骨架：偏好仅存于客户端，避免首帧显示默认选中后跳变。 */
  mounted: boolean
}

/** 浏览偏好：默认视图 / 排序 / Tab，与产品页共用同一份本地偏好。 */
export function BrowsePreferences({ view, sort, tab, mounted }: BrowsePreferencesProps) {
  return (
    <FieldGroup>
      <PrefField
        label="默认视图"
        hint="打开工具列表时使用的布局"
        options={VIEW_OPTIONS}
        skeletonWidth="w-32"
        disabled={!mounted}
        value={view}
        onChange={setView}
      />
      <PrefField
        label="默认排序"
        hint="工具列表的默认排序方式"
        options={SORT_OPTIONS}
        skeletonWidth="w-64"
        disabled={!mounted}
        value={sort}
        onChange={setSort}
      />
      <PrefField
        label="默认 Tab"
        hint="首页默认展示的工具范围"
        options={TAB_OPTIONS}
        skeletonWidth="w-48"
        disabled={!mounted}
        value={tab}
        onChange={setTab}
      />
    </FieldGroup>
  )
}
