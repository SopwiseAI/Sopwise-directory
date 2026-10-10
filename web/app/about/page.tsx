import type { Metadata } from "next"
import Link from "next/link"
import { Database, ExternalLink, HardDrive, Zap, type LucideIcon } from "lucide-react"
import { getStats } from "@/lib/data"
import { InfoLayout, type InfoSectionDef } from "@/components/info/info-shell"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
import { StatItem } from "@/components/ui/stat-item"
import { getBaseUrl } from "@/lib/utils"
import pkg from "@/package.json"

export const metadata: Metadata = {
  title: "关于",
  description: "XiGee 是一个纯静态、数据驱动的精选 AI 工具目录，精选值得用的 AI 工具，每一款都经过人工筛选。",
  alternates: { canonical: "/about" },
  openGraph: { title: "关于", description: "了解 XiGee 的甄选理念、数据规模与工作方式" }
}

/** 站点的四条工作原则 */
const PRINCIPLES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Database, title: "数据驱动", description: "工具与分类来自结构化数据源，数据更新后站点重新构建。" },
  { icon: Zap, title: "纯静态", description: "页面预渲染为静态文件，加载快、可离线缓存，也能被搜索引擎收录。" },
  { icon: HardDrive, title: "本地优先", description: "主题、浏览偏好与访问历史只保存在你的浏览器里，不上传服务器。" },
  { icon: ExternalLink, title: "直达官网", description: "工具卡片直接跳转外部官网，不在站内中转过一道。" }
]

const stats = getStats()

const sections: InfoSectionDef[] = [
  {
    id: "what-we-do",
    title: "我们做什么",
    body: (
      <p>
        XiGee 把散落各处的 AI
        工具甄选收拢到一处：按分类浏览、直接搜索，点开即达官方网站。我们不做中间页，只做一条从「发现」到「使用」的
        最短路径。
      </p>
    )
  },
  {
    id: "data",
    title: "数据一览",
    // 窄屏一行内换行排布；宽屏切成三等分铺满卡片，不把三个数字挤在左半边
    body: (
      <div className="flex flex-wrap gap-x-10 gap-y-3 rounded-lg border bg-card px-4 py-3.5 @2xl:grid @2xl:grid-cols-3 @2xl:gap-x-4">
        <StatItem label="收录工具" value={stats.products} size="lg" />
        <StatItem label="分类" value={stats.categories} size="lg" />
        <StatItem label="精选" value={stats.featured} size="lg" />
      </div>
    )
  },
  {
    id: "how-it-works",
    title: "如何工作",
    body: (
      <ItemGroup className="gap-0.5">
        {PRINCIPLES.map(({ icon: Icon, title, description }) => (
          <Item key={title} className="px-0">
            <ItemMedia variant="icon">
              <Icon aria-hidden />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{title}</ItemTitle>
              <ItemDescription>{description}</ItemDescription>
            </ItemContent>
          </Item>
        ))}
      </ItemGroup>
    )
  },
  {
    id: "privacy",
    title: "隐私",
    body: (
      <p>
        XiGee 没有账号系统，不收集个人信息。关于本地存储与第三方链接的说明，见{" "}
        <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
          隐私政策
        </Link>
        。
      </p>
    )
  },
  {
    id: "tech",
    title: "技术",
    body: (
      <>
        <p>基于 Next.js（App Router）静态生成，React + Tailwind CSS 构建，部署于 Vercel。</p>
        <p className="font-data text-xs text-muted-foreground/70">
          当前版本 v{pkg.version} · {getBaseUrl().replace(/^https?:\/\//, "")}
        </p>
      </>
    )
  }
]

export default function AboutPage() {
  return (
    <InfoLayout
      title="关于 XiGee"
      description="精选 AI 工具目录 —— 精选值得用的 AI 工具，每一款都经过人工筛选。"
      updated="2026-10-02"
      sections={sections}
    />
  )
}
