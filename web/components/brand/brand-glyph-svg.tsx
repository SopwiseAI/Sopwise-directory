import { BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX } from "@/lib/brand"

interface BrandGlyphSvgProps {
  /** 尺寸：数字（px）或百分比字符串，同时作用于 width/height。 */
  size: number | string
  /** 填充色。satori 不支持 currentColor，须显式传入色值。 */
  color: string
}

/**
 * 纯几何星芒（satori / ImageResponse 专用）。
 * 用内联属性 + 显式填充色，供 icon / apple-icon / opengraph 复用；
 * 页面内渲染请用 BrandGlyph（支持 Tailwind / currentColor）。
 */
export function BrandGlyphSvg({ size, color }: BrandGlyphSvgProps) {
  return (
    <svg width={size} height={size} viewBox={BRAND_GLYPH_VIEWBOX} fill={color}>
      <path d={BRAND_GLYPH_PATH} />
    </svg>
  )
}
