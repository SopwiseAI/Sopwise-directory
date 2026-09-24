import type { MetadataRoute } from "next"
import { getAllCategories } from "@/lib/data"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sopwise.com"
  const categories = getAllCategories()

  const categoryUrls = categories.map(cat => ({
    url: `${baseUrl}/category/${cat.id}`,
    lastModified: new Date()
  }))

  return [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/settings`, lastModified: new Date() },
    ...categoryUrls
  ]
}
