import { useEffect } from "react"
import type { Decorator, Preview } from "@storybook/nextjs-vite"
import "../app/globals.css"

type ThemeMode = "light" | "dark" | "system"

/**
 * 与 lib/theme.applyTheme 对齐的 Storybook 主题装饰器：
 * 项目主题由 `<html class="dark">` + `<html data-theme>` 双轨驱动，
 * 故这里同时写入两者，保证 ThemeToggle / ThemeSwitch 的 CSS 选中态与真实站点一致。
 * 系统模式跟随 prefers-color-scheme。
 */
function ThemeEffect({ theme }: { theme: ThemeMode }) {
  useEffect(() => {
    const root = document.documentElement
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches)
      root.classList.toggle("dark", dark)
      root.setAttribute("data-theme", theme)
    }
    apply()
    media.addEventListener("change", apply)
    return () => media.removeEventListener("change", apply)
  }, [theme])
  return null
}

const withProjectTheme: Decorator = (Story, context) => {
  const theme = (context.globals.theme as ThemeMode) ?? "light"
  return (
    <>
      <ThemeEffect theme={theme} />
      <Story />
    </>
  )
}

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    backgrounds: { disable: true },
    nextjs: { appDirectory: true }
  },
  globalTypes: {
    theme: {
      description: "项目主题（对齐 html class + data-theme）",
      toolbar: {
        title: "Theme",
        icon: "paintbrush",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
          { value: "system", title: "System", icon: "browser" }
        ],
        dynamicTitle: true
      }
    }
  },
  initialGlobals: { theme: "light" },
  decorators: [withProjectTheme]
}

export default preview
