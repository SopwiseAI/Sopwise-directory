"use client"

import { useSyncExternalStore } from "react"
import { Monitor, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getTheme, setTheme, subscribeTheme, type ThemeMode } from "@/lib/theme"

export type { ThemeMode }

export function useTheme(): ThemeMode {
  return useSyncExternalStore(subscribeTheme, getTheme, () => "system" as ThemeMode)
}

export { setTheme }

/** 单按钮循环切换（亮 → 暗 → 系统 → 亮），折叠态使用 */
export default function ThemeToggle() {
  const theme = useTheme()

  const next: Record<ThemeMode, ThemeMode> = {
    light: "dark",
    dark: "system",
    system: "light"
  }

  const nextMode = next[theme]

  const labels: Record<ThemeMode, string> = {
    light: "亮色",
    dark: "暗色",
    system: "系统"
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(nextMode)}
      aria-label={`当前：${labels[theme]}模式，点击切换${labels[nextMode]}`}
      title={`当前：${labels[theme]}模式`}
    >
      {/* TH-01：三个图标叠放，由 <html data-theme> 驱动 CSS 显示，首帧即为正确图标 */}
      <span className="relative inline-flex size-4">
        <Sun className="theme-i-light absolute inset-0 size-4" aria-hidden />
        <Moon className="theme-i-dark absolute inset-0 size-4" aria-hidden />
        <Monitor className="theme-i-system absolute inset-0 size-4" aria-hidden />
      </span>
    </Button>
  )
}
