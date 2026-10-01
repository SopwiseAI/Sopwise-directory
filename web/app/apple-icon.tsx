import { ImageResponse } from "next/og"
import { BrandGlyphSvg } from "@/components/brand/brand-glyph-svg"
import { BRAND_FOREGROUND, BRAND_TILE } from "@/lib/brand"

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
      <BrandGlyphSvg size="70%" color={BRAND_FOREGROUND.light} />
    </div>,
    size
  )
}
