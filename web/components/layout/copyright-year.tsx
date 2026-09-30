"use client"

/** 版权年份：客户端计算，避免静态构建时固化；suppressHydrationWarning 兼容构建年与当前年的差异。 */
export function CopyrightYear({ className }: { className?: string }) {
  return (
    <span className={className} suppressHydrationWarning>
      {new Date().getFullYear()}
    </span>
  )
}
