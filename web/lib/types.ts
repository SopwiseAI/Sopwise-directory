export const PRICINGS = ["free", "freemium", "paid", "opensource"] as const

export type Pricing = (typeof PRICINGS)[number]

export interface Category {
  id: string
  name: string
  icon: string
}

export interface Product {
  id: string
  name: string
  description: string
  url: string
  categories: string[]
  tags?: string[]
  pricing?: Pricing
  featured?: boolean
  publishedAt?: string
  createdAt?: string
}

export interface SiteData {
  categories: Category[]
  products: Product[]
}
