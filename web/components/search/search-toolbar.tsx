"use client"

import { PageBar } from "@/components/layout/page-bar"
import { FilterSelect } from "@/components/ui/filter-select"
import { formatCount } from "@/lib/format"
import { SEARCH_SORT_OPTIONS, type SearchSort } from "@/lib/search-params"
import { cn } from "@/lib/utils"

export interface SearchFacet {
  id: string
  label: string
  count: number
}

interface SearchToolbarProps {
  /** 结果集的分类分布：只列实际命中的分类，按计数倒序。 */
  facets: readonly SearchFacet[]
  /** 当前（可能已被分类筛选过的）结果数。 */
  shown: number
  /** 未筛选时的总命中数，用于「7 / 12」这种表达。 */
  total: number
  category: string
  onCategoryChange: (id: string) => void
  sort: SearchSort
  onSortChange: (sort: SearchSort) => void
}

/**
 * 搜索结果二级栏：左边是分类 facet（含「全部」），右边是结果计数与排序。
 *
 * 全站二级栏形态统一走 `PageBar`（h-11 单行、切换器横向滚动、辅助控件钉右）。
 * facet 只列**实际命中的分类**——搜「图像」时列出一堆零结果的分类只会让人白点。
 */
export function SearchToolbar({
  facets,
  shown,
  total,
  category,
  onCategoryChange,
  sort,
  onSortChange
}: SearchToolbarProps) {
  const filtered = category !== ""

  return (
    <PageBar
      width="content"
      actions={
        <>
          <span role="status" aria-live="polite" className="font-data text-xs text-muted-foreground">
            {filtered ? `${formatCount(shown)} / ${formatCount(total)} 个结果` : `${formatCount(total)} 个结果`}
          </span>
          <FilterSelect
            label="排序"
            icon={SEARCH_SORT_OPTIONS.find((o) => o.value === sort)?.icon ?? SEARCH_SORT_OPTIONS[0].icon}
            value={sort}
            options={SEARCH_SORT_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(value) => onSortChange(value as SearchSort)}
            active={sort !== "relevance"}
          />
        </>
      }
    >
      <FacetChip active={!filtered} onClick={() => onCategoryChange("")}>
        全部
        <span className="font-data text-xs opacity-70">{formatCount(total)}</span>
      </FacetChip>
      {facets.map((facet) => (
        <FacetChip
          key={facet.id}
          active={facet.id === category}
          onClick={() => onCategoryChange(facet.id === category ? "" : facet.id)}
        >
          {facet.label}
          <span className="font-data text-xs opacity-70">{formatCount(facet.count)}</span>
        </FacetChip>
      ))}
    </PageBar>
  )
}

/** 分类 facet 胶囊：与产品筛选、信息导航共用同一套选中态语言（bg-brand/10 + 品牌色）。 */
function FacetChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "bg-brand/10 font-medium text-brand" : "text-muted-foreground hover:bg-brand/5 hover:text-brand"
      )}
    >
      <span className="whitespace-nowrap">{children}</span>
    </button>
  )
}
