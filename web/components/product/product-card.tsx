import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/url"
import { productHistoryAttrs } from "@/lib/product"
import { Badge } from "@/components/ui/badge"
import { PricingBadge } from "@/components/product/pricing-badge"
import { StretchedProductLink } from "@/components/product/stretched-link"
import { categoryIconNode } from "@/lib/category-icon-node"
import { ArrowUpRight } from "lucide-react"

interface ProductCardProps {
  product: Product
  /** 分类展示信息（名称 + 图标），缺省时仅显示域名。 */
  categoryLabel?: string
  categoryIcon?: string
}

const MAX_TAGS = 3

/**
 * 产品卡片：外壳是容器（不再是 `<a>`），点击面由标题的 stretched link 提供 ——
 * 点卡片任意处进 `/tool/[slug]` 详情页，右上角箭头直达官网。
 */
export function ProductCard({ product, categoryLabel, categoryIcon }: ProductCardProps) {
  const domain = getDomain(product.url)
  const tags = product.tags ?? []
  const shownTags = tags.slice(0, MAX_TAGS)
  const extraTags = tags.length - shownTags.length

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4 transition-colors hover:border-foreground/15 hover:bg-secondary/50"
      data-product-card={product.id}
    >
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-2">
          <h2 className="min-w-0 text-lg font-semibold tracking-tight text-foreground">
            <StretchedProductLink id={product.id} name={product.name} className="after:rounded-lg" />
          </h2>
          {/* 官网入口：z-10 抬到铺满热区之上，保住「点击直达官网」 */}
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            {...productHistoryAttrs(product)}
            aria-label={`打开 ${product.name} 官网（新标签页）`}
            title={`打开 ${domain}`}
            className="relative z-10 mt-1 shrink-0 rounded text-muted-foreground/50 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowUpRight
              className="size-4 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              aria-hidden
            />
          </a>
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
    </article>
  )
}
