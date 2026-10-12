import { ArrowUpRight } from "lucide-react"
import type { Product } from "@/lib/types"
import { productHistoryAttrs } from "@/lib/product"
import { Badge } from "@/components/ui/badge"
import { PricingBadge } from "@/components/product/pricing-badge"
import { StretchedProductLink } from "@/components/product/stretched-link"
import { categoryIconNode } from "@/lib/category-icon-node"
import { getDomain } from "@/lib/url"
import { cn } from "@/lib/utils"

const MAX_TAGS = 2

/**
 * 列表行：与 `ProductCard` 同一套点击模型 —— 外壳是容器，标题的 stretched link 铺满整行，
 * 右侧箭头是独立的官网出站链接。
 */
export function ProductRow({
  product,
  last = false,
  categoryLabel,
  categoryIcon
}: {
  product: Product
  last?: boolean
  categoryLabel?: string
  categoryIcon?: string
}) {
  const domain = getDomain(product.url)
  const tags = product.tags ?? []
  const shownTags = tags.slice(0, MAX_TAGS)
  const extraTags = tags.length - shownTags.length

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary/50",
        !last && "border-b border-border"
      )}
      data-product-row={product.id}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 shrink text-lg font-semibold tracking-tight">
            <StretchedProductLink id={product.id} name={product.name} className="focus-visible:after:ring-inset" />
          </span>
          {categoryLabel && (
            <span
              className="hidden shrink-0 items-center gap-1 font-data text-muted-foreground sm:inline-flex"
              title={categoryLabel}
            >
              {categoryIcon ? categoryIconNode(categoryIcon, "size-3") : null}
              {categoryLabel}
            </span>
          )}
          <span className="hidden shrink-0 font-data text-muted-foreground/70 md:inline">{domain}</span>
        </div>
        <p className="truncate text-sm text-muted-foreground" title={product.description}>
          {product.description}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {shownTags.length > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {shownTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="max-w-[6rem] truncate px-1.5 py-0 text-xs font-normal">
                {tag}
              </Badge>
            ))}
            {extraTags > 0 && (
              <Badge variant="secondary" className="px-1.5 py-0 text-xs font-normal text-muted-foreground">
                +{extraTags}
              </Badge>
            )}
          </div>
        )}
        {product.pricing && <PricingBadge pricing={product.pricing} />}
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          {...productHistoryAttrs(product)}
          aria-label={`打开 ${product.name} 官网（新标签页）`}
          title={`打开 ${domain}`}
          className="relative z-10 shrink-0 rounded text-muted-foreground/60 outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowUpRight
            className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            aria-hidden
          />
        </a>
      </div>
    </div>
  )
}
