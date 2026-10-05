import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { HeroBackdrop, HeroEyebrow } from "@/components/hero/hero-primitives"
import { HeroStatsBar } from "@/components/hero/hero-stats-bar"
import { getStats } from "@/lib/data"

/**
 * 首页 Hero · 编辑精选（A 方案）
 *
 * 排版主导的克制高级感：品牌字体大标题 + 一句价值主张 + 双 CTA + 实时统计，
 * 靠留白、细网格与顶部微光建立纵深，而非重卡片。紧凑（≈313px），不挤占下方列表。
 * Server Component，纯 CSS，无客户端 JS → 零 FOUC / 零 CLS。
 */
export function Hero() {
  const stats = getStats()

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-b from-secondary/50 to-background px-6 py-7 sm:px-9 sm:py-9"
    >
      <HeroBackdrop align="left" />

      <div className="hero-rise relative max-w-2xl">
        <HeroEyebrow>Curated AI Directory</HeroEyebrow>

        {/* 页面一级标题仅屏幕阅读器可见，视觉标题用 h2，避免与产品卡片 h3 跨级 */}
        <h1 className="sr-only">XiGee — 精选 AI 工具目录</h1>
        <h2
          id="hero-title"
          className="mt-3.5 font-brand text-[1.875rem] font-semibold leading-[1.05] tracking-[-0.03em] text-balance sm:text-[2.625rem]"
        >
          <span className="bg-gradient-to-r from-foreground via-foreground/90 to-foreground/65 bg-clip-text text-transparent">
            发现值得用的 AI 工具
          </span>
        </h2>

        <p className="mt-3 max-w-xl text-sm leading-[1.65] text-muted-foreground sm:text-[0.9375rem]">
          精选值得用的 AI 工具，每一款都经过人工筛选——按分类浏览，或直接搜索。
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <Link
            href="/?tab=all#product-browser"
            className={buttonVariants({
              size: "lg",
              className: "shadow-sm transition-shadow hover:shadow-md"
            })}
          >
            浏览全部工具
            <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/?tab=featured#product-browser"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 text-sm font-medium text-foreground transition-colors hover:border-brand/30 hover:bg-secondary/60 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Sparkles className="size-4 text-muted-foreground" />
            探索精选
          </Link>
        </div>

        <Separator className="mt-7" />
        <HeroStatsBar stats={stats} className="pt-4" />
      </div>
    </section>
  )
}
