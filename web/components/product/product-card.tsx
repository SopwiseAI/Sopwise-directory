import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/product-icon"
import { Badge } from "@/components/ui/badge"
import { PricingBadge } from "@/components/product/pricing-badge"

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const domain = getDomain(product.url)

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      data-history-id={product.id}
      data-history-name={product.name}
      data-history-url={product.url}
      data-history-category={product.categoryId}
      data-history-pricing={product.pricing ?? ""}
      className="group flex flex-col gap-3 rounded-lg border bg-card p-4 outline-none transition-all hover:bg-brand/[0.02] hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="space-y-1">
        <h3 className="truncate text-base font-medium tracking-tight text-foreground">{product.name}</h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{product.description}</p>
      </div>

      {product.tags && product.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {product.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3">
        {product.pricing ? (
          <PricingBadge pricing={product.pricing} />
        ) : (
          <span className="font-data text-muted-foreground">—</span>
        )}
        <span className="font-data text-muted-foreground">{domain}</span>
      </div>
    </a>
  )
}
