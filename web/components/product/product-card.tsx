import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/url"
import { productHistoryAttrs } from "@/lib/product"
import { Badge } from "@/components/ui/badge"
import { PricingBadge } from "@/components/product/pricing-badge"
import { categoryIconNode } from "@/lib/category-icon-node"
import { ArrowUpRight } from "lucide-react"

interface ProductCardProps {
  product: Product
  /** 分类展示信息（名称 + 图标），缺省时仅显示域名。 */
  categoryLabel?: string
  categoryIcon?: string
}

const MAX_TAGS = 3

export function ProductCard({ product, categoryLabel, categoryIcon }: ProductCardProps) {
  const domain = getDomain(product.url)
  const tags = product.tags ?? []
  const shownTags = tags.slice(0, MAX_TAGS)
  const extraTags = tags.length - shownTags.length

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      {...productHistoryAttrs(product)}
      title={product.name}
      className="group flex flex-col gap-3 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/15 hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-lg font-semibold tracking-tight text-foreground">{product.name}</h3>
          <ArrowUpRight
            className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground"
            aria-hidden
          />
        </div>
        {/* 固定两行：不足两行也保留高度，保证网格卡片等高对齐 */}
        <p className="mt-1.5 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      </div>

      {/* 分类 + 标签：限量展示，超出以 +N 收纳，避免多标签/多分类撑破卡片 */}
      <div className="flex flex-wrap items-center gap-1">
        {categoryLabel && (
          <Badge
            variant="outline"
            className="gap-1 px-1.5 py-0 text-xs font-normal text-muted-foreground"
            title={categoryLabel}
          >
            {categoryIcon ? categoryIconNode(categoryIcon, "size-3") : null}
            <span className="max-w-[7rem] truncate">{categoryLabel}</span>
          </Badge>
        )}
        {shownTags.map((tag) => (
          <Badge key={tag} variant="secondary" className="max-w-[7rem] truncate px-1.5 py-0 text-xs font-normal">
            {tag}
          </Badge>
        ))}
        {extraTags > 0 && (
          <Badge variant="secondary" className="px-1.5 py-0 text-xs font-normal text-muted-foreground">
            +{extraTags}
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        {product.pricing ? (
          <PricingBadge pricing={product.pricing} />
        ) : (
          <span className="font-data text-muted-foreground">—</span>
        )}
        <span className="font-data text-xs text-muted-foreground">{domain}</span>
      </div>
    </a>
  )
}
