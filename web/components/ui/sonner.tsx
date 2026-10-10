"use client"

import type { CSSProperties } from "react"
import { CircleCheckIcon, InfoIcon, Loader2Icon, OctagonXIcon, TriangleAlertIcon } from "lucide-react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { useTheme } from "@/lib/theme"

/**
 * 全局 Toast 容器（sonner）。
 *
 * 与官方 registry 版本的差异：主题跟随站内自己的主题系统（`lib/theme` + `<html class="dark">`），
 * 不引入 next-themes —— 站内已有一套「首绘前由内联脚本定主题」的机制，两套并存会互相打架。
 * 图标按项目图标库（lucide）直接传入，配色走站内语义 token（popover / border / radius）。
 */
function Toaster({ ...props }: ToasterProps) {
  const theme = useTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)"
        } as CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
