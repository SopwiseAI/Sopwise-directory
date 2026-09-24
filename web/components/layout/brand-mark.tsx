import { cn } from "@/lib/utils"

interface BrandMarkProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

/**
 * Sopwise 品牌标识：书签轮廓 + 主色圆角方块。
 * "书签"语义贴合 AI 产品书签站定位；方块 + 内切圆角营造控制台质感。
 */
export function BrandMark({ className, size = "md" }: BrandMarkProps) {
  const sizeClass = {
    sm: "size-6 rounded-md",
    md: "size-8 rounded-lg",
    lg: "size-9 rounded-xl"
  }[size]

  const iconSize = {
    sm: "size-3.5",
    md: "size-4.5",
    lg: "size-5"
  }[size]

  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground",
        sizeClass,
        className
      )}
    >
      {/* 书签轮廓 */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={iconSize}
      >
        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
        <path d="m9 10 2 2 4-4" />
      </svg>
      {/* 右下角微光点（强调"被收录/活跃"语义） */}
      <span className="absolute bottom-[3px] right-[3px] size-1 rounded-full bg-primary-foreground/70" />
    </span>
  )
}
