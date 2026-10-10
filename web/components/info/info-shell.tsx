import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { pageShell } from "@/lib/layout"
import { InfoNav } from "@/components/info/info-nav"

export interface InfoSectionDef {
  /** 小节锚点 id：正文章节保留 id，方便从站内其它位置深链到具体条款 */
  id: string
  title: string
  body: ReactNode
}

interface InfoLayoutProps {
  title: string
  description?: string
  updated?: string
  /** 正文小节 */
  sections: readonly InfoSectionDef[]
}

/** 宽屏下的「小节标签 + 内容」两列骨架；窄屏不生效，自动退回堆叠。 */
const SECTION_GRID = "@4xl:grid @4xl:grid-cols-[13rem_minmax(0,1fr)] @4xl:items-start @4xl:gap-10"

/**
 * 信息区（设置/关于/隐私/条款）统一布局：顶部子导航 + 标题 + 「小节标签 / 内容」两列正文。
 *
 * 页框走 lib/layout.ts 的统一档位（内容型，比首页内容区小一档）。宽屏下每个小节切成
 * [标签 13rem | 内容 1fr]：左列由小节标题占住，内容列就能一路铺到页框右边缘 ——
 * 既没有"正文右侧一条空白"，长文行宽也不会失控（实测每行 64 字左右）。
 * 窄屏（容器 < 896px）自动退回"标题在上、内容在下"的堆叠版式。
 */
export function InfoLayout({ title, description, updated, sections }: InfoLayoutProps) {
  return (
    <div className={pageShell("content", "@container")}>
      <div className="relative mb-6 border-b border-border">
        <InfoNav className="pb-2" />
        {/* 窄屏横向滚动时的右侧渐隐提示（与全站分类子导航一致） */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent" />
      </div>

      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="max-w-3xl text-sm text-muted-foreground">{description}</p>}
      </header>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
        {sections.map((section) => (
          <InfoSection key={section.id} {...section} />
        ))}

        {updated && (
          <div className={SECTION_GRID}>
            <p className="font-data text-xs text-muted-foreground/70 @4xl:col-start-2">最后更新：{updated}</p>
          </div>
        )}
      </div>
    </div>
  )
}

/** 正文小节：宽屏左列放小节标签，右列放内容；窄屏标题在上、内容在下。 */
function InfoSection({ id, title, body }: InfoSectionDef) {
  return (
    <section id={id} className={cn("scroll-mt-28 space-y-2 @4xl:space-y-0", SECTION_GRID)}>
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      {/* 内容列自成容器：内部控件栅格按列宽（而非视口）决定排几列 */}
      <div className="@container flex flex-col gap-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {body}
      </div>
    </section>
  )
}
