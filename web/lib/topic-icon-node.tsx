import type { ReactNode } from "react"

/**
 * 主题图标就是 emoji 字符本身，直接存在数据里（`data/topics.json`）。
 *
 * 换成 emoji 的原因：新增主题只需要改数据，不必改代码、重新构建 —— Lucide 那种
 * 「数据里存组件名 + 代码里维护 iconMap」的做法，每加一个主题都要动代码。
 *
 * studio 侧 `xg_topic.icon` 现在也存 emoji；若同步过来的仍是旧 Lucide 组件名（纯 ASCII），
 * 会被这里的 `ASCII_ICON_NAME` 判为非 emoji 并回退。防线见 `lib/data.test.ts` 的「icon 必须是 emoji」
 * 断言（会让 CI 变红）与 `web/AGENTS.md` 的「主题图标是 emoji」一节。
 */
export const DEFAULT_TOPIC_ICON = "📦"

/**
 * 非 emoji 值的识别式：值形如纯 ASCII 单词（PascalCase 如 `MessageSquare`，
 * 或 kebab-case 如 `message-square`）时，说明数据没迁移成 emoji。用它兜底并告警，
 * 避免把英文图标名当成图标渲染成一串字母。
 */
const ASCII_ICON_NAME = /^[A-Za-z][A-Za-z0-9-]*$/

/** 告警去重：一次坏导出会让所有主题每条都 warn，刷屏反而淹没「全都中招」这个信号。 */
const warnedIcons = new Set<string>()

/** 解析主题图标：空值或疑似旧 Lucide 组件名时回退 `DEFAULT_TOPIC_ICON`（非 production 告警）。 */
export function resolveTopicIcon(icon: string): string {
  const value = icon.trim()
  if (!value || ASCII_ICON_NAME.test(value)) {
    if (process.env.NODE_ENV !== "production" && !warnedIcons.has(icon)) {
      warnedIcons.add(icon)
      console.warn(
        `[topic-icon] 图标不是 emoji: "${icon}"，已回退为 ${DEFAULT_TOPIC_ICON}` +
          `（若整批主题都这样，说明 studio 导出的 icon 还是 Lucide 名）`,
      )
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
