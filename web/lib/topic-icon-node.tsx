import type { ReactNode } from "react"

/**
 * 主题图标就是 emoji 字符本身，直接存在数据里（`data/topics.json`，源头是库里的 `xg_topic.icon`）。
 *
 * 换成 emoji 的原因：新增主题只需要改数据，不必改代码、重新构建 —— Lucide 那种
 * 「数据里存组件名 + 代码里维护 iconMap」的做法，每加一个主题都要动代码。
 */
export const DEFAULT_TOPIC_ICON = "📦"

/**
 * 非 emoji 值的识别式：值形如纯 ASCII 单词（PascalCase 如 `MessageSquare`，
 * 或 kebab-case 如 `message-square`）时，说明数据没迁移成 emoji。用它兜底并告警，
 * 避免把英文图标名当成图标渲染成一串字母。
 */
const ASCII_ICON_NAME = /^[A-Za-z][A-Za-z0-9-]*$/

/** 解析主题图标：空值或疑似旧 Lucide 组件名时回退 `DEFAULT_TOPIC_ICON`（开发环境告警）。 */
export function resolveTopicIcon(icon: string): string {
  const value = icon.trim()
  if (!value || ASCII_ICON_NAME.test(value)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[topic-icon] 图标不是 emoji: "${icon}"，已回退为 ${DEFAULT_TOPIC_ICON}`)
    }
    return DEFAULT_TOPIC_ICON
  }
  return value
}

/**
 * 主题图标节点。
 *
 * emoji 是字体字形，靠 `font-size`（`text-*`）缩放，且自带颜色、不继承 `currentColor` ——
 * 与 Lucide 的「`currentColor` + `size-*` 宽高缩放」不同，所以调用方传的是字号类而不是尺寸类。
 * `leading-none` 避免行高把外框撑高，`shrink-0` 保证在 flex 行里不被压缩。
 */
export function topicIconNode(icon: string, cls: string = "text-base leading-none shrink-0"): ReactNode {
  return (
    <span className={cls} aria-hidden>
      {resolveTopicIcon(icon)}
    </span>
  )
}
