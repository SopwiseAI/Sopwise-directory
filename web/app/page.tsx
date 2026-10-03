import type { Metadata } from "next"
import { getAllCategories, getAllProducts } from "@/lib/data"
import { ProductBrowser } from "@/components/product/product-browser"
import { Hero } from "@/components/hero/hero"

export const metadata: Metadata = {
  alternates: { canonical: "/" }
}

const products = getAllProducts()
const categories = getAllCategories()

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Hero />
      <ProductBrowser products={products} categories={categories} />
    </div>
  )
}
