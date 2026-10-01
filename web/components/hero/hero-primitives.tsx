import { cn } from "@/lib/utils"

/**
 * Hero 的克制纵深：细网格 + 顶部径向微光，全部用 token，明暗双主题自适配。
 * 网格用 mask 径向淡出，避免「贴满背景」的廉价感。
 */
export function HeroBackdrop({ className, align = "left" }: { className?: string; align?: "left" | "center" }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className={cn(
          "absolute inset-0 opacity-70 dark:opacity-50 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:26px_26px]",
          align === "center"
            ? "[mask-image:radial-gradient(ellipse_55%_55%_at_50%_0%,#000_55%,transparent)]"
            : "[mask-image:radial-gradient(ellipse_70%_60%_at_28%_0%,#000_50%,transparent)]"
        )}
      />
      <div
        className={cn(
          "absolute -top-28 h-64 w-[40rem] rounded-full bg-foreground/[0.04] blur-[80px] dark:bg-foreground/[0.09]",
          align === "center" ? "left-1/2 -translate-x-1/2" : "left-[12%]"
        )}
      />
    </div>
  )
}

/** 眉标：脉动小点 + 字距拉开的标签。 */
export function HeroEyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 font-data uppercase tracking-[0.22em] text-muted-foreground",
        className
      )}
    >
      <span className="relative flex size-1.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand/60" />
        <span className="relative inline-flex size-1.5 rounded-full bg-brand" />
      </span>
      {children}
    </p>
  )
}
