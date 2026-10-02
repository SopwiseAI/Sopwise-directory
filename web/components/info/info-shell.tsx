import type { ReactNode } from "react"
import { InfoNav } from "@/components/info/info-nav"

interface InfoShellProps {
  title: string
  description?: string
  updated?: string
  children: ReactNode
}

/** 信息页（设置/关于/隐私/条款）统一外壳：标题 + 描述 + 互链导航 + 正文排版 + 更新日期。 */
export function InfoShell({ title, description, updated, children }: InfoShellProps) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        <InfoNav />
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">{children}</div>

      {updated && <p className="font-data text-xs text-muted-foreground/70">最后更新：{updated}</p>}
    </div>
  )
}

/** 正文小节：统一标题层级与间距。 */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight text-foreground">{title}</h2>
      <div className="space-y-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">{children}</div>
    </section>
  )
}
