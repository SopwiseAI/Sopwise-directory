"use client"

import { ArrowUpRight } from "lucide-react"
import { Highlighted } from "@/components/search/highlight"
import { PricingBadge } from "@/components/product/pricing-badge"
import { Badge } from "@/components/ui/badge"
import { productHistoryAttrs } from "@/lib/product"
import { matchedTags, snippet, type SearchDoc } from "@/lib/search"
import { getDomain } from "@/lib/url"
import { cn } from "@/lib/utils"

interface SearchResultRowProps {
  product: SearchDoc
  query: string
  /** 分类 id → 名称，用于「没有命中标签」时的副信息。 */
  categoryNames: Readonly<Record<string, string>>
  last: boolean
}

/**
 * 一条搜索结果：名称 + **命中上下文片段** + 命中的标签 / 分类 + 价格。
 *
 * 两处是这次改动的重点：
 * 1. 描述走 `snippet()` 而不是从头 `truncate` —— 命中词落在中后段时也能看见，用户才知道为什么命中；
 * 2. 右侧标签优先显示**真正命中查询词**的那些，而不是固定取前两个。
 *
 * 行本身是可聚焦的 `<a>`（带 `data-search-result`），列表内 ↑↓ 靠它移动焦点。
 */
export function SearchResultRow({ product, query, categoryNames, last }: SearchResultRowProps) {
  const domain = getDomain(product.url)
  const tags = matchedTags(product.tags, query)
  const category = product.categories.map((id) => categoryNames[id]).find(Boolean)

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      data-search-result=""
      {...productHistoryAttrs(product)}
      className={cn(
        "group flex items-center gap-3 px-4 py-3 transition-colors outline-none hover:bg-brand/[0.02] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !last && "border-b border-border"
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 truncate text-base font-medium">
            <Highlighted text={product.name} query={query} variant="tint" />
          </span>
          <span className="hidden shrink-0 font-data text-xs text-muted-foreground sm:inline">{domain}</span>
        </div>
        {product.description && (
          <p className="truncate text-sm text-muted-foreground">
            <Highlighted text={snippet(product.description, query)} query={query} variant="em" />
          </p>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {tags.length > 0 ? (
          <div className="hidden items-center gap-1 md:flex">
            {/* 标签本身就是「命中证据」，不必在徽章里再叠一层高亮 —— 那是纯粹的视觉噪音 */}
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        ) : (
          category && <span className="hidden text-xs text-muted-foreground md:inline">{category}</span>
        )}
        {product.pricing && <PricingBadge pricing={product.pricing} />}
        <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
      </div>
    </a>
  )
}
