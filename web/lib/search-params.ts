import { ArrowDownAZ, Clock, Sparkles, type LucideIcon } from "lucide-react"

/** 搜索结果排序维度。 */
export type SearchSort = "relevance" | "latest" | "name"

export interface SearchSortOption {
  value: SearchSort
  label: string
  icon: LucideIcon
}

/**
 * 排序选项：默认「相关度」（Fuse 打分序），另给「最新」与「名称」——
 * 目录类站点里「最近收录」是仅次于相关度的真实需求，而名称序便于按字母核对。
 */
export const SEARCH_SORT_OPTIONS: readonly SearchSortOption[] = [
  { value: "relevance", label: "相关度", icon: Sparkles },
  { value: "latest", label: "最新", icon: Clock },
  { value: "name", label: "名称 A-Z", icon: ArrowDownAZ },
]

const VALID_SORTS: ReadonlySet<string> = new Set(SEARCH_SORT_OPTIONS.map((o) => o.value))

export function isSearchSort(value: string | null): value is SearchSort {
  return value !== null && VALID_SORTS.has(value)
}

/** 搜索页的 URL 状态：查询词 / 排序。两者都写进地址栏，链接可分享。 */
export interface SearchUrlState {
  query: string
  sort: SearchSort
}

/** 只需要「能按 key 取值」：Next 的 ReadonlyURLSearchParams 也满足。 */
export interface SearchParamsLike {
  get(key: string): string | null
}

export function readSearchState(params: SearchParamsLike): SearchUrlState {
  const sort = params.get("sort")
  return {
    query: params.get("q") ?? "",
    sort: isSearchSort(sort) ? sort : "relevance",
  }
}
