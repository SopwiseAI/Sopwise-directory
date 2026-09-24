"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { setTheme, useTheme, type ThemeMode } from "@/components/layout/theme-toggle";

const options: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "亮色", icon: Sun },
  { value: "dark", label: "暗色", icon: Moon },
  { value: "system", label: "跟随系统", icon: Monitor },
];

/** 设置页主题选择：三张选项卡片，选中态边框高亮 */
export function ThemeSwitch() {
  const theme = useTheme();

  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
      role="radiogroup"
      aria-label="主题模式"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "border-primary/40 bg-secondary text-foreground"
                : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            )}
          >
            <Icon className={cn("size-5", active && "text-primary")} aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}