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
    className:
      "bg-green-500/10 text-emerald-700 dark:bg-green-400/10 dark:text-green-400 border-green-500/20 dark:border-green-400/20",
    dotClass: "bg-green-500 dark:bg-green-400"
  },
  freemium: {
    label: "FREEMIUM",
    className:
      "bg-blue-500/10 text-blue-800 dark:bg-blue-400/10 dark:text-blue-400 border-blue-500/20 dark:border-blue-400/20",
    dotClass: "bg-blue-500 dark:bg-blue-400"
  },
  paid: {
    label: "PAID",
    className:
      "bg-orange-500/10 text-orange-600 dark:bg-orange-400/10 dark:text-orange-300 border-orange-500/20 dark:border-orange-400/20",
    dotClass: "bg-orange-500 dark:bg-orange-400"
  },
  opensource: {
    label: "OPEN SOURCE",
    className:
      "bg-purple-500/10 text-purple-800 dark:bg-purple-400/10 dark:text-purple-300 border-purple-500/20 dark:border-purple-400/20",
    dotClass: "bg-purple-500 dark:bg-purple-400"
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
