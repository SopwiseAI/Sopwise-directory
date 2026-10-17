"use client"

import { SearchX } from "lucide-react"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia } from "@/components/ui/empty"
import { ToolRow } from "@/components/tool/tool-row"
import { TopicBrowse } from "@/components/search/topic-browse"
import { SearchResultRow } from "@/components/search/search-result-row"
import { SuggestionChips } from "@/components/search/suggestion-chips"
import type { SearchDoc } from "@/lib/search"
import type { Topic, Tool } from "@/lib/types"

interface SearchNoResultsProps {
  query: string
  /** 放宽阈值再搜一次的「也许相关」结果：让「差一点就中」的用户有路可走，而不是撞进死路。 */
  fallback: readonly SearchDoc[]
  /** 也许相关为空时的最后兜底：精选推荐。 */
  featured: readonly Tool[]
  /** 换词建议（按查询串洗牌，不同查询给不同推荐）。 */
  suggestions: readonly string[]
  topics: readonly Topic[]
  topicCounts: Record<string, number>
  topicNames: Readonly<Record<string, string>>
  onPick: (query: string) => void
}

/**
 * 未找到结果：先承认没找到，再给出路 ——
 * 「也许你想找」（宽松阈值命中）、换词建议、按主题浏览，都没有时才退回精选推荐。
 *
 * 旧版只有一句「未找到」加主题网格：用户敲错一个字就直接撞墙。
 */
export function SearchNoResults({
  query,
  fallback,
  featured,
  suggestions,
  topics,
  topicCounts,
  topicNames,
  onPick,
}: SearchNoResultsProps) {
  return (
    <div className="flex flex-col gap-8">
      <Empty className="py-8">
        <EmptyMedia variant="icon" className="size-14 rounded-xl border [&_svg:not([class*='size-'])]:size-6">
          <SearchX />
        </EmptyMedia>
        <EmptyHeader>
          {/* 元素切分处不留空格：否则渲染成「未找到与 「zzz」 相关的工具」 */}
          <EmptyDescription>
            未找到与
            <span className="font-medium text-foreground">「{query}」</span>
            相关的工具
          </EmptyDescription>
          {/* 说清「能搜什么」比再说一遍「没找到」有用：多数无结果来自搜了目录里没有的维度 */}
          <EmptyDescription className="text-xs">
            可以搜工具名称、描述、标签或主题，例如「图像生成」「代码」「翻译」
          </EmptyDescription>
        </EmptyHeader>
        {suggestions.length > 0 && (
          <EmptyContent>
            <SuggestionChips label="换个词试试：" suggestions={suggestions} onPick={onPick} />
          </EmptyContent>
        )}
      </Empty>

      {fallback.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
            也许你想找
            <span className="font-data text-xs font-normal text-muted-foreground">MAYBE</span>
          </h2>
          <div className="overflow-hidden rounded-lg border bg-card">
            {fallback.map((tool, i) => (
              <SearchResultRow
                key={tool.id}
                tool={tool}
                query={query}
                topicNames={topicNames}
                last={i === fallback.length - 1}
              />
            ))}
          </div>
        </section>
      ) : (
        featured.length > 0 && (
          <section className="flex flex-col gap-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              精选推荐
              <span className="font-data text-xs font-normal text-muted-foreground">FEATURED</span>
            </h2>
            <div className="rounded-lg border bg-card">
              {featured.slice(0, 6).map((tool, i, arr) => (
                <ToolRow key={tool.id} tool={tool} last={i === arr.length - 1} />
              ))}
            </div>
          </section>
        )
      )}

      <TopicBrowse topics={topics} topicCounts={topicCounts} />
    </div>
  )
}
