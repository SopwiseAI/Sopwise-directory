import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** 站点根 URL（统一去掉结尾斜杠，避免 sitemap/robots/metadataBase 拼接出 `//`）。 */
export function getBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.xigee.net").replace(/\/+$/, "")
}
