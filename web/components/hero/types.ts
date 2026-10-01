import type { Category, Product } from "@/lib/types"

export interface HeroStats {
  products: number
  categories: number
  featured: number
}

export interface HeroData {
  stats: HeroStats
  featured: readonly Product[]
  categories: readonly Category[]
}
