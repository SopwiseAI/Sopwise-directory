import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"
import { fileURLToPath } from "node:url"
import { dirname, resolve } from "node:path"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
})

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    // MVP 阶段无产品图片/logo，统一用首字母或 SVG 图标；引入图片后改回 remotePatterns + 开启优化
    unoptimized: true
  },
  turbopack: {
    root: resolve(dirname(fileURLToPath(import.meta.url)))
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ]
      }
    ]
  }
}

export default withBundleAnalyzer(nextConfig)
