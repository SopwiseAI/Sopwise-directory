import { ImageResponse } from "next/og"
import { BRAND_FOREGROUND, BRAND_TILE, BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX } from "@/lib/brand"

export const size = { width: 32, height: 32 }
export const contentType = "image/png"

/** 站点 favicon：近黑底 + 白色星芒。 */
export default function Icon() {
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
      <svg width={23} height={23} viewBox={BRAND_GLYPH_VIEWBOX} fill={BRAND_FOREGROUND.light}>
        <path d={BRAND_GLYPH_PATH} />
      </svg>
    </div>,
    size
  )
}
