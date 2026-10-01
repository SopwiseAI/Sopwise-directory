import { cn } from "@/lib/utils"
import { BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX } from "@/lib/brand"

interface BrandGlyphProps {
  className?: string
}

/** 纯几何星芒标记（无容器），fill 跟随 currentColor。 */
export function BrandGlyph({ className }: BrandGlyphProps) {
  return (
    <svg viewBox={BRAND_GLYPH_VIEWBOX} fill="currentColor" className={cn("shrink-0", className)} aria-hidden>
      <path d={BRAND_GLYPH_PATH} />
    </svg>
  )
}

interface BrandMarkProps {
  className?: string
  /** 覆盖星芒尺寸（如 em 相对尺寸），用于字标等比缩放 */
  glyphClassName?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const BOX = {
  sm: "size-6 rounded-[7px]",
  md: "size-8 rounded-[9px]",
  lg: "size-9 rounded-[10px]",
  xl: "size-12 rounded-[13px]"
} as const

const GLYPH = {
  sm: "size-3.5",
  md: "size-4.5",
  lg: "size-5",
  xl: "size-7"
} as const

/** 品牌标记：墨色纯色圆角方块 + 星芒（深色下自动反相）。 */
export function BrandMark({ className, glyphClassName, size = "md" }: BrandMarkProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "brand-tile relative inline-flex shrink-0 items-center justify-center bg-brand text-brand-foreground",
        BOX[size],
        className
      )}
    >
      <BrandGlyph className={cn(GLYPH[size], glyphClassName)} />
    </span>
  )
}
