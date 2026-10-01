import { ImageResponse } from "next/og"
import { BRAND_FOREGROUND, BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX, BRAND_TILE } from "@/lib/brand"

export const contentType = "image/png"

/** 多尺寸 favicon：32 标准 + 96 Retina + 192/512 PWA 安装。 */
export function generateImageMetadata() {
  return [
    { id: "32", size: { width: 32, height: 32 }, alt: "XiGee" },
    { id: "96", size: { width: 96, height: 96 }, alt: "XiGee" },
    { id: "192", size: { width: 192, height: 192 }, alt: "XiGee" },
    { id: "512", size: { width: 512, height: 512 }, alt: "XiGee" }
  ]
}

/** 站点 favicon：近黑底 + 白色星芒。 */
export default async function Icon({ id }: { id: Promise<string | number> }) {
  const iconId = String(await id)
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
      <svg width="70%" height="70%" viewBox={BRAND_GLYPH_VIEWBOX} fill={BRAND_FOREGROUND.light}>
        <path d={BRAND_GLYPH_PATH} />
      </svg>
    </div>,
    { width: Number(iconId), height: Number(iconId) }
  )
}
