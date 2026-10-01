import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand/brand-mark"

type WordmarkSize = "sm" | "md" | "lg" | "xl"

interface WordmarkProps {
  size?: WordmarkSize
  /** default：前景色字标（侧栏/hero/footer）；brand：品牌色字标（移动端 header）。 */
  tone?: "default" | "brand"
  className?: string
}

/**
 * 字标档位：字号决定一切。标记框（1.28em）与星芒（0.8em）按 em 跟随字号，
 * 因此四档的「图标 : 文字」比例完全一致，不会出现某档图标偏大。
 */
const CFG: Record<WordmarkSize, { gap: string; text: string; net: string }> = {
  sm: { gap: "gap-[0.4em]", text: "text-sm", net: "text-[0.62em]" },
  md: { gap: "gap-[0.42em]", text: "text-lg", net: "text-[0.62em]" },
  lg: { gap: "gap-[0.44em]", text: "text-2xl", net: "text-[0.6em]" },
  xl: { gap: "gap-[0.46em]", text: "text-2xl sm:text-3xl", net: "text-[0.56em]" }
}

/**
 * 统一品牌字标：`XiGee.net` —— Outfit Variable 粗体 XiGee + 弱化小号 .net。
 * 左上角 / hero / footer / 移动端共用，保证各处完全一致。
 */
export function Wordmark({ size = "md", tone = "default", className }: WordmarkProps) {
  const cfg = CFG[size]

  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center font-brand font-semibold tracking-[-0.02em]",
        cfg.text,
        cfg.gap,
        className
      )}
    >
      <BrandMark className="size-[1.28em] rounded-[0.36em]" glyphClassName="size-[0.8em]" />
      <span data-wordmark-text className={cn("min-w-0 truncate", tone === "brand" && "text-brand")}>
        XiGee
        <span className={cn("ml-[0.14em] font-normal tracking-normal text-muted-foreground", cfg.net)}>.net</span>
      </span>
    </span>
  )
}
