"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return
    const { name, value, id, rating } = metric
    // 占位：后续接入 Vercel Analytics / Plausible / GA 时替换为上报逻辑
    console.info(`[Web Vitals] ${name}: ${value} (${rating}) id=${id}`)
  })

  return null
}
