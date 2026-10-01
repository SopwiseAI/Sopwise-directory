import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/url"
import { getProductDate, productHistoryAttrs } from "@/lib/product"
import { formatDate } from "@/lib/format"
import { Badge } from "@/components/ui/badge"
import { PricingBadge } from "@/components/product/pricing-badge"

interface ProductCardProps {
  product: Product
  showDate?: boolean
}

export function ProductCard({ product, showDate }: ProductCardProps) {
  const domain = getDomain(product.url)
  const date = showDate ? getProductDate(product) : null

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      {...productHistoryAttrs(product)}
      className="group flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:bg-secondary/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="space-y-1.5">
        <h3 className="truncate text-base font-medium tracking-tight text-foreground">{product.name}</h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{product.description}</p>
      </div>

      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {product.tags.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        {product.pricing ? (
          <PricingBadge pricing={product.pricing} />
        ) : (
          <span className="font-data text-muted-foreground">—</span>
        )}
        <div className="flex items-center gap-2">
          {date && <span className="font-data text-muted-foreground/60">{formatDate(date)}</span>}
          <span className="font-data text-muted-foreground">{domain}</span>
        </div>
      </div>
    </a>
  )
}
