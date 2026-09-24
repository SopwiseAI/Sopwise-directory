import { type Metadata } from "next"
import { ThemeSwitch } from "@/components/layout/theme-switch"
import { getAllCategories, getAllProducts, getFeaturedProducts } from "@/lib/data"
import { formatCount } from "@/lib/format"

export const metadata: Metadata = {
  title: "设置",
  description: "Sopwise Directory 设置：外观、数据统计与关于"
}

const products = getAllProducts()
const categories = getAllCategories()
const featured = getFeaturedProducts()

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="font-mono text-2xl tabular-nums text-foreground">{formatCount(value)}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">设置</h1>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground">主题</h2>
        <div className="space-y-3 rounded-lg border bg-card px-4 py-3.5">
          <p className="text-xs text-muted-foreground">选择外观模式，跟随系统会自动适配深浅色</p>
          <ThemeSwitch />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground">数据</h2>
        <div className="rounded-lg border bg-card px-4 py-3.5">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <StatItem label="产品" value={products.length} />
            <StatItem label="分类" value={categories.length} />
            <StatItem label="精选" value={featured.length} />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground">关于</h2>
        <div className="space-y-2 rounded-lg border bg-card px-4 py-3.5">
          <p className="text-sm">Sopwise Directory — AI 产品书签</p>
          <p className="text-xs text-muted-foreground">
            发现和探索优秀的 AI 产品，Sopwise Directory 为你精选各类 AI 工具与应用。
            数据驱动、纯静态构建，点击产品直达官方网站。
          </p>
        </div>
      </section>
    </div>
  )
}
