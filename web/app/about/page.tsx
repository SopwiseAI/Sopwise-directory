import type { Metadata } from "next"
import Link from "next/link"
import { getStats } from "@/lib/data"
import { InfoShell, InfoSection } from "@/components/info/info-shell"
import { StatItem } from "@/components/ui/stat-item"
import { getBaseUrl } from "@/lib/utils"
import pkg from "@/package.json"

export const metadata: Metadata = {
  title: "关于",
  description: "XiGee 是一个纯静态、数据驱动的 AI 产品发现引擎，精选并分类收录各类 AI 工具与应用。",
  alternates: { canonical: "/about" },
  openGraph: { title: "关于", description: "了解 XiGee 的理念、数据规模与工作方式" }
}

const stats = getStats()

export default function AboutPage() {
  return (
    <InfoShell
      title="关于 XiGee"
      description="你的 AI 发现引擎 —— 精选并分类收录各类 AI 工具与应用。"
      updated="2026-10-02"
    >
      <InfoSection title="我们做什么">
        <p>
          XiGee 把散落各处的 AI
          产品收拢到一处：按分类浏览、直接搜索，点开即达官方网站。我们不做中间页，只做一条从「发现」到「使用」的
          最短路径。
        </p>
      </InfoSection>

      <InfoSection title="数据一览">
        <div className="flex flex-wrap gap-x-10 gap-y-4 rounded-lg border bg-card px-4 py-3.5">
          <StatItem label="收录产品" value={stats.products} size="lg" />
          <StatItem label="分类" value={stats.categories} size="lg" />
          <StatItem label="精选" value={stats.featured} size="lg" />
        </div>
      </InfoSection>

      <InfoSection title="如何工作">
        <ul>
          <li>数据驱动：产品与分类来自结构化数据源，更新即重新构建。</li>
          <li>纯静态：站点预渲染为静态页面，加载快、可离线缓存、可被搜索引擎收录。</li>
          <li>本地优先：你的主题、浏览偏好与访问历史仅保存在本机浏览器。</li>
          <li>直达官网：产品卡片直接跳转外部官网，不在站内中转。</li>
        </ul>
      </InfoSection>

      <InfoSection title="隐私">
        <p>
          XiGee 没有账号系统，不收集个人信息。关于本地存储与第三方链接的说明，见{" "}
          <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
            隐私政策
          </Link>
          。
        </p>
      </InfoSection>

      <InfoSection title="技术">
        <p>基于 Next.js（App Router）静态生成，React + Tailwind CSS 构建，部署于 Vercel。</p>
        <p className="font-data text-xs text-muted-foreground/70">
          当前版本 v{pkg.version} · {getBaseUrl().replace(/^https?:\/\//, "")}
        </p>
      </InfoSection>
    </InfoShell>
  )
}
