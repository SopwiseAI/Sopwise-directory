"use client"

import { useReportWebVitals } from "next/web-vitals"

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0]

/**
 * 回调必须保持稳定引用：useReportWebVitals 会对每次渲染传入的新函数重放「目前为止的指标」，
 * 内联箭头函数会导致指标重复上报。故提升为模块级常量（对齐 Next.js 官方文档）。
 */
const reportWebVitals: ReportWebVitalsCallback = (metric) => {
  if (process.env.NODE_ENV !== "production") return
  const { name, value, id, rating } = metric
  // 占位：后续接入 Vercel Analytics / Plausible / GA 时替换为上报逻辑
  console.info(`[Web Vitals] ${name}: ${value} (${rating}) id=${id}`)
}

export function WebVitals() {
  useReportWebVitals(reportWebVitals)

  return null
}
