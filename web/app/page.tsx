import { getAllProducts } from "@/lib/data"
import { ProductBrowser } from "@/components/product/product-browser"
import { BrandShowcase } from "@/components/layout/brand-showcase"

const products = getAllProducts()

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <BrandShowcase />
      <ProductBrowser products={products} />
    </div>
  )
}
