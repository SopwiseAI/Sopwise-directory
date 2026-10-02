import type { ReactNode } from "react"
import { InfoNav } from "@/components/info/info-nav"

interface InfoLayoutProps {
  title: string
  description?: string
  updated?: string
  children: ReactNode
}

/**
 * 信息区（设置/关于/隐私/条款）统一布局：顶部水平子导航 + 下方正文，四页共享。
 */
export function InfoLayout({ title, description, updated, children }: InfoLayoutProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="relative mb-6 border-b border-border">
        <InfoNav className="pb-2" />
        {/* 窄屏横向滚动时的右侧渐隐提示（与全站分类子导航一致） */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-background to-transparent" />
      </div>

      <div className="space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </header>

        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>

        {updated && <p className="font-data text-xs text-muted-foreground/70">最后更新：{updated}</p>}
      </div>
    </div>
  )
}

/** 正文小节：统一标题层级与间距。 */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  )
}
