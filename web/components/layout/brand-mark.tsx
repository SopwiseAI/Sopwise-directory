import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

/**
 * XiGee 品牌标识：X 对角线交叉 + 右上指南针指针。
 * "X" 传达精准交叉，指针暗示"发现方向"，贴合 AI 发现引擎定位。
 */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const sizeClass = {
    sm: "size-6 rounded-md",
    md: "size-8 rounded-lg",
    lg: "size-9 rounded-xl"
  }[size]

  const iconSize = {
    sm: "size-3.5",
    md: "size-4",
    lg: "size-5"
  }[size]

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-brand text-brand-foreground",
        sizeClass,
        className
      )}
    >
      {/* X 对角线 + 右上指针 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSize}
      >
        <path d="M5 5 L19 19" />
        <path d="M19 5 L12 12" />
        <path d="M14.5 5 L19 5 L19 9.5" />
      </svg>
    </span>
  )
}
