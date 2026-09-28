import type { Pricing } from "@/lib/types"

export interface PricingStyle {
  label: string
  className: string
  dotClass: string
}

/** 价格 → 状态徽章（mono 语义色） */
export const pricingStyles: Record<Pricing, PricingStyle> = {
  free: {
    label: "FREE",
    className: "bg-chart-3/10 text-chart-3 border-chart-3/20",
    dotClass: "bg-chart-3"
  },
  freemium: {
    label: "FREEMIUM",
    className: "bg-chart-1/10 text-chart-1 border-chart-1/20",
    dotClass: "bg-chart-1"
  },
  paid: {
    label: "PAID",
    className: "bg-chart-5/10 text-chart-5 border-chart-5/20",
    dotClass: "bg-chart-5"
  },
  opensource: {
    label: "OPEN SOURCE",
    className: "bg-chart-4/10 text-chart-4 border-chart-4/20",
    dotClass: "bg-chart-4"
  }
}

export function PricingBadge({ pricing }: { pricing: Pricing }) {
  const style = pricingStyles[pricing]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono text-xs font-medium tracking-wide ${style.className}`}
    >
      <span className={`size-1.5 rounded-full ${style.dotClass}`} aria-hidden />
      {style.label}
    </span>
  )
}
