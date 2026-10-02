import { ImageResponse } from "next/og"
import { BrandGlyphSvg } from "@/components/brand/brand-glyph-svg"
import { BRAND_FOREGROUND, BRAND_MUTED, BRAND_PAGE, BRAND_TILE } from "@/lib/brand"
import { getStats } from "@/lib/data"
import { OG_FONTS } from "@/lib/og-fonts"
import { getBaseUrl } from "@/lib/utils"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "XiGee — 你的 AI 发现引擎"

const SITE_HOST = getBaseUrl()
  .replace(/^https?:\/\//, "")
  .replace(/\/$/, "")
const stats = getStats()

/** OG 分享图（构建时渲染 PNG；品牌色/字体引用真源，规模数据取自 data.json）。 */
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
        background: BRAND_PAGE.dark,
        color: BRAND_TILE.dark,
        fontFamily: "Outfit"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            backgroundColor: BRAND_TILE.dark,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <BrandGlyphSvg size={46} color={BRAND_FOREGROUND.dark} />
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>XiGee</div>
          <div style={{ fontSize: 26, color: BRAND_MUTED.dark, marginTop: 4 }}>你的 AI 发现引擎</div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          fontSize: 60,
          fontWeight: 600,
          lineHeight: 1.2,
          letterSpacing: -1
        }}
      >
        发现最好的 AI 工具与应用
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 28, fontSize: 26, color: BRAND_MUTED.dark }}
      >
        <span>{stats.categories} 个分类</span>
        <span>·</span>
        <span>{stats.products} 款精选产品</span>
        <span>·</span>
        <span>持续更新</span>
      </div>

      <div style={{ display: "flex", fontSize: 24, color: BRAND_MUTED.dark, marginTop: 40 }}>{SITE_HOST}</div>
    </div>,
    { ...size, fonts: OG_FONTS }
  )
}
