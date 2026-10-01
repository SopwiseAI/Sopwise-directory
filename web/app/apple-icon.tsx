import { ImageResponse } from "next/og"
import { BRAND_FOREGROUND, BRAND_TILE, BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX } from "@/lib/brand"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

/** Apple touch icon：近黑底 + 白色星芒。 */
export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: BRAND_TILE.light
      }}
    >
      <svg width={126} height={126} viewBox={BRAND_GLYPH_VIEWBOX} fill={BRAND_FOREGROUND.light}>
        <path d={BRAND_GLYPH_PATH} />
      </svg>
    </div>,
    size
  )
}
