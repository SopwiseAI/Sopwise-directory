import type { NextConfig } from "next"
import bundleAnalyzer from "@next/bundle-analyzer"

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true"
})

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true
  }
}

export default withBundleAnalyzer(nextConfig)
