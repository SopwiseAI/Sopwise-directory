import type { MetadataRoute } from "next"
import { BRAND_PAGE } from "@/lib/brand"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XiGee — AI 发现引擎",
    short_name: "XiGee",
    description: "精选各类 AI 工具与应用，按分类浏览或直接搜索你需要的能力",
    lang: "zh-CN",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: BRAND_PAGE.light,
    theme_color: BRAND_PAGE.light,
    icons: [
      {
        src: "/icon/32",
        sizes: "32x32",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon/96",
        sizes: "96x96",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon/192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icon/512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any"
      }
    ]
  }
}
