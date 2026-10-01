import { ImageResponse } from "next/og"
import { BRAND_FOREGROUND, BRAND_TILE, BRAND_GLYPH_PATH, BRAND_GLYPH_VIEWBOX } from "@/lib/brand"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "XiGee — AI Discovery Engine"

/** 动态 OG 分享图（运行时渲染 PNG，无本地资源 404） */
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "80px 96px",
        background: "#151517",
        color: "#f9fafb",
        fontFamily: "sans-serif"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            backgroundColor: BRAND_TILE.dark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="46" height="46" viewBox={BRAND_GLYPH_VIEWBOX} fill={BRAND_FOREGROUND.dark}>
            <path d={BRAND_GLYPH_PATH} />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>XiGee</div>
          <div style={{ fontSize: 26, color: "#adb2b8", marginTop: 4 }}>AI Discovery Engine</div>
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 52,
          fontWeight: 600,
          lineHeight: 1.25,
          letterSpacing: -1
        }}
      >
        A curated directory of AI tools &amp; products
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 24, color: "#adb2b8", marginTop: 40 }}>
        XiGee.net
      </div>
    </div>,
    size
  )
}
