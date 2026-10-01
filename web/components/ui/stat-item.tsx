import { cn } from "@/lib/utils"
import { formatCount } from "@/lib/format"

export interface StatItemProps {
  label: string
  value: number
  size?: "sm" | "lg"
  className?: string
}

/** 统计数字 + 标签，供设置页等复用。 */
export function StatItem({ label, value, size = "sm", className }: StatItemProps) {
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span className={cn("font-mono tabular-nums", size === "lg" ? "text-2xl text-foreground" : "text-lg")}>
        {formatCount(value)}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}
