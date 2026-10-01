import { type Metadata } from "next"
import { ThemeSwitch } from "@/components/layout/theme-switch"
import { getStats } from "@/lib/data"
import { StatItem } from "@/components/ui/stat-item"

export const metadata: Metadata = {
  title: "设置",
  description: "XiGee 设置：外观、数据统计与关于",
  robots: { index: false, follow: true }
}

const stats = getStats()

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="sr-only">设置</h1>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3.5 before:w-0.5 before:rounded-full before:bg-brand/40">
          主题
        </h2>
        <div className="space-y-3 rounded-lg border bg-card px-4 py-3.5">
          <p className="text-xs text-muted-foreground">选择外观模式，跟随系统会自动适配深浅色</p>
          <ThemeSwitch />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3.5 before:w-0.5 before:rounded-full before:bg-brand/40">
          数据
        </h2>
        <div className="rounded-lg border bg-card px-4 py-3.5">
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            <StatItem label="产品" value={stats.products} size="lg" />
            <StatItem label="分类" value={stats.categories} size="lg" />
            <StatItem label="精选" value={stats.featured} size="lg" />
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm text-muted-foreground relative pl-3 before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-3.5 before:w-0.5 before:rounded-full before:bg-brand/40">
          关于
        </h2>
        <div className="space-y-2 rounded-lg border bg-card px-4 py-3.5">
          <p className="text-sm">XiGee — 你的 AI 发现引擎</p>
          <p className="text-xs text-muted-foreground">
            发现和探索优秀的 AI 产品，XiGee 为你精选各类 AI 工具与应用。 数据驱动、纯静态构建，从 XiGee 直达官方网站。
          </p>
        </div>
      </section>
    </div>
  )
}
