"use client"

import { Monitor, Moon, Sun } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { setTheme, useTheme, type ThemeMode } from "@/lib/theme"

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "亮色", icon: Sun },
  { value: "dark", label: "暗色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor }
]

/** 设置页主题选择：基于 shadcn ToggleGroup 的三选一卡片。 */
export function ThemeSwitch() {
  const theme = useTheme()

  return (
    <ToggleGroup
      value={[theme]}
      onValueChange={(value) => {
        if (value[0]) setTheme(value[0] as ThemeMode)
      }}
      aria-label="主题模式"
      className="grid w-full grid-cols-1 gap-2 @xl:grid-cols-3"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <ToggleGroupItem
          key={value}
          value={value}
          variant="outline"
          aria-label={label}
          className="h-auto flex-col gap-1.5 py-3 text-xs text-muted-foreground data-[pressed]:border-ring data-[pressed]:text-foreground"
        >
          <Icon className="size-5" aria-hidden />
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
