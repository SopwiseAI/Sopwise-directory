"use client"

import { useReportWebVitals } from "next/web-vitals"

export function WebVitals() {
  useReportWebVitals((metric) => {
    if (process.env.NODE_ENV !== "production") return
    const { name, value, id, rating } = metric
    console.debug(`[Web Vitals] ${name}: ${value} (${rating}) id=${id}`)
  })

  return null
}
