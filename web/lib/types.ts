export const PRICINGS = ["free", "freemium", "paid", "opensource"] as const

export type Pricing = (typeof PRICINGS)[number]

export interface Category {
  id: string
  name: string
  icon: string
  /**
   * 分类描述：分类页 meta description 与页头正文的数据源，由 studio 导出（`sd_category.description`）。
   * 上游未填写时不下发该字段 —— 消费方据此回落到兜底文案，而不是渲染空描述。
   */
  description?: string
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
