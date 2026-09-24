import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "XiGee — 你的 AI 发现引擎"

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
        background: "#1a1438",
        color: "#f5f5f5",
        fontFamily: "sans-serif"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 32 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 16,
            background: "#4d33b8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M5 5 L19 19" stroke="#f5f5f5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M19 5 L12 12" stroke="#f5f5f5" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
            <path
              d="M14.5 5 L19 5 L19 9.5"
              stroke="#f5f5f5"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>XiGee</div>
          <div style={{ fontSize: 26, color: "#9aa0a6", marginTop: 4 }}>你的 AI 发现引擎</div>
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
        精选的 AI 工具与产品导航
      </div>
      <div style={{ display: "flex", flexDirection: "column", fontSize: 24, color: "#9aa0a6", marginTop: 40 }}>
        XiGee.net
      </div>
    </div>,
    size
  )
}
