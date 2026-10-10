"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { setTheme, useTheme, type ThemeMode } from "@/lib/theme"

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "亮色", icon: Sun },
  { value: "dark", label: "暗色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor }
]

/**
 * 设置页主题选择：三选一分段控件。
 * `spacing={0}` 让三格共用边框连成一体，视觉上是「一个控件」而不是三个方框。
 */
export function ThemeSwitch() {
  const theme = useTheme()

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(value) => {
        if (value[0]) setTheme(value[0] as ThemeMode)
      }}
      aria-label="主题模式"
      variant="outline"
      size="lg"
      spacing={0}
      className="w-fit"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem key={value} value={value} className="gap-1.5 px-3">
          <Icon data-icon="inline-start" aria-hidden />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
