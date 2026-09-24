import { ArrowUpRight } from "lucide-react"
import type { Product } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { ProductIcon } from "@/components/product/product-icon"
import { PricingBadge } from "@/components/product/pricing-badge"
import { getDomain } from "@/lib/product-icon"
import { cn } from "@/lib/utils"

export function ProductRow({ product, last = false }: { product: Product; last?: boolean }) {
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
      className={cn(
        "group flex items-center gap-3 px-4 py-3 transition-all hover:bg-brand/[0.02] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        !last && "border-b border-border"
      )}
    >
      <ProductIcon
        name={product.name}
        url={product.url}
        icon={product.icon}
        className="h-8 w-8 rounded-md border"
        imgClassName="h-8 w-8"
      />

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="shrink-0 truncate text-sm font-medium">{product.name}</span>
          <span className="hidden shrink-0 font-mono text-xs text-muted-foreground sm:inline">{domain}</span>
        </div>
        <p className="truncate text-xs text-muted-foreground">{product.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {product.tags && product.tags.length > 0 && (
          <div className="hidden items-center gap-1 md:flex">
            {product.tags.slice(0, 2).map(tag => (
              <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
        {product.pricing && <PricingBadge pricing={product.pricing} />}
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
      </div>
    </a>
  )
}
