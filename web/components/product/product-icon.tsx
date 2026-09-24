"use client"

import { useState } from "react"
import Image from "next/image"
import { getFaviconUrl } from "@/lib/product-icon"
import { cn } from "@/lib/utils"

interface ProductIconProps {
  name: string
  url: string
  icon?: string
  className?: string
  imgClassName?: string
}

/** 产品图标：显式 icon > favicon（由 URL 域名提取）> 首字母回退 */
export function ProductIcon({ name, url, icon, className, imgClassName }: ProductIconProps) {
  const [failed, setFailed] = useState(false)
  const favicon = getFaviconUrl(url)
  const initial = name.charAt(0).toUpperCase()

  const showImg = (icon || favicon) && !failed

  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden bg-muted",
        className
      )}
      aria-hidden
    >
      {showImg ? (
        <Image
          src={icon || favicon}
          alt=""
          width={64}
          height={64}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          unoptimized
          className={cn("object-cover", imgClassName)}
        />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">{initial}</span>
      )}
    </div>
  )
}