import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"
export const alt = "Sopwise - AI 产品书签"

/** 动态 OG 分享图（运行时渲染 PNG，无本地资源 404；替代原 metadata 的 /og.png 引用） */
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
        background: "#16181d",
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
            background: "#16181d",
            border: "1px solid #f5f5f522",
            borderColor: "#f5f5f522",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"
              stroke="#f5f5f5"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="m9 10 2 2 4-4" stroke="#f5f5f5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>Sopwise</div>
          <div style={{ fontSize: 26, color: "#9aa0a6", marginTop: 4 }}>AI 产品书签</div>
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
        Sopwise · AI Directory
      </div>
    </div>,
    size
  )
}
