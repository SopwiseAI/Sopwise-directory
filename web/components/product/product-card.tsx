"use client"

import { useState } from "react"
import { ArrowUpRight, ChevronDown } from "lucide-react"
import type { Product } from "@/lib/types"
import { getDomain } from "@/lib/product-icon"
import { Badge } from "@/components/ui/badge"
import { ProductIcon } from "@/components/product/product-icon"
import { PricingBadge } from "@/components/product/pricing-badge"

interface ProductCardProps {
  product: Product
}

/** 卡片模式 —— 安静克制的产品卡片：细边框、无浮起、hover 仅加深边框 */
export function ProductCard({ product }: ProductCardProps) {
  const domain = getDomain(product.url)
  const [expanded, setExpanded] = useState(false)

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
      className="group flex flex-col gap-3.5 rounded-lg border bg-card p-4 outline-none transition-all hover:bg-brand/[0.02] hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <div className="flex items-start justify-between gap-3">
        <ProductIcon
          name={product.name}
          url={product.url}
          icon={product.icon}
          className="h-9 w-9 rounded-md border bg-background"
          imgClassName="h-9 w-9"
        />
        <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70 transition-colors group-hover:text-foreground" />
      </div>

      <div className="space-y-1">
        <h3 className="truncate text-sm font-medium tracking-tight text-foreground">{product.name}</h3>
        <p
          className={`text-xs leading-relaxed text-muted-foreground ${expanded ? "" : "line-clamp-3"} cursor-pointer`}
          onClick={e => {
            e.preventDefault()
            setExpanded(!expanded)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setExpanded(!expanded)
            }
          }}
        >
          {product.description}
          <span className="ml-1 inline-flex items-center text-xs font-medium text-muted-foreground/60">
            {expanded ? "收起" : "展开"}
            <ChevronDown className={`ml-0.5 size-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </span>
        </p>
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
