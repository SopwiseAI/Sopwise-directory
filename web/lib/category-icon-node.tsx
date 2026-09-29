import type { ReactNode } from "react"
import {
  MessageSquare,
  Image,
  Code,
  PenTool,
  Video,
  Music,
  Zap,
  BarChart,
  Palette,
  GraduationCap,
  Megaphone,
  Languages,
  Microscope,
  Workflow,
  Bot,
  Box,
  Scale,
  TrendingUp,
  HeartPulse,
  Gamepad2,
  type LucideIcon
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  MessageSquare,
  Image,
  Code,
  PenTool,
  Video,
  Music,
  Zap,
  BarChart,
  Palette,
  GraduationCap,
  Megaphone,
  Languages,
  Microscope,
  Workflow,
  Bot,
  Box,
  Scale,
  TrendingUp,
  HeartPulse,
  Gamepad2
}

export { iconMap as CATEGORY_ICONS }

export function categoryIconNode(iconName: string, cls: string = "size-4 shrink-0"): ReactNode {
  const Icon = iconMap[iconName]
  if (!Icon) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[category-icon] 未知图标名: "${iconName}"，请在 iconMap 中注册`)
    }
    return null
  }
  return <Icon className={cls} aria-hidden />
}
