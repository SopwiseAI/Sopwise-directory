import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XiGee — AI 发现引擎",
    short_name: "XiGee",
    description: "精选各类 AI 工具与应用，按分类浏览或直接搜索你需要的能力",
    start_url: "/",
    display: "standalone",
    background_color: "#fafafb",
    theme_color: "#fafafb",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
}
