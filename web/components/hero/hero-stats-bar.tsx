import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"
import type { HeroStats } from "@/components/hero/types"

/** Hero 实时统计条：发丝分隔，等宽数字，克制的精致感。 */
export function HeroStatsBar({ stats, className }: { stats: HeroStats; className?: string }) {
  const items: [string, number][] = [
    ["产品", stats.products],
    ["分类", stats.categories],
    ["精选", stats.featured]
  ]

  return (
    <dl className={cn("flex flex-wrap items-center gap-x-8 gap-y-2", className)}>
      {items.map(([label, value], i) => (
        <div
          key={label}
          className={cn(
            "flex items-baseline gap-2",
            i > 0 &&
              "relative pl-8 before:absolute before:left-0 before:top-[0.1em] before:h-[1.1em] before:w-px before:bg-border/80"
          )}
        >
          <dd className="font-mono text-xl leading-none font-medium tabular-nums tracking-tight text-foreground">
            {formatCount(value)}
          </dd>
          <dt className="text-xs tracking-wide text-muted-foreground">{label}</dt>
        </div>
      ))}
    </dl>
  )
}
