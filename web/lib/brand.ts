/**
 * 品牌单一真源：标记几何 + 墨色单色配色。
 * BrandMark / Wordmark / icon / apple-icon / opengraph 均从这里取，避免多处不一致。
 */

/** 星芒标记 viewBox（正方形，24×24 便于等比缩放）。 */
export const BRAND_GLYPH_VIEWBOX = "0 0 24 24"

/**
 * 四角星芒（发现 / 精选）。尖角 N/E/S/W，纵向略长于横向（罗盘/北极星感）。
 * 凹边由指向中心的二次贝塞尔控制点拉出。
 */
export const BRAND_GLYPH_PATH = "M12 0.8 Q13.2 10.6 21.8 12 Q13.2 13.4 12 23.2 Q10.8 13.4 2.2 12 Q10.8 10.6 12 0.8 Z"

/** 品牌墨块底色（浅色场景近黑，深色场景反相近白）。 */
export const BRAND_TILE = {
  light: "#0f1115",
  dark: "#f9fafb"
} as const

/** 品牌墨块上的前景色（标记/文字）。 */
export const BRAND_FOREGROUND = {
  light: "#ffffff",
  dark: "#0f1115"
} as const
