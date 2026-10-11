import { highlightSegments } from "@/lib/search"

/**
 * 命中强调的强度档位。
 *
 * 这里有个容易踩的坑：**品牌色不能当强调色用** —— `--brand` 就是 `--primary`，
 * 亮色下 `#0f1115`、暗色下 `#f9fafb`，与 `--foreground` 完全一致，给命中片段上色
 * 等于没上色。所以只有两条路：垫背景，或者改字重/明度。
 */
export type HighlightVariant = "tint" | "em"

const VARIANT_CLASS: Record<HighlightVariant, string> = {
  /**
   * 名称这类「主角」：给命中片段垫一层很淡的底。
   * **刻意不加 `padding` 与圆角** —— 旧版是 `bg-brand/15 px-0.5 rounded-sm`，
   * 那 2px 横向内边距会把中文文本撑出参差的空隙，看着像往字上贴了块补丁。
   */
  tint: "bg-brand/10 text-foreground",
  /**
   * 描述这类正文：把命中的字从 muted 提到 foreground 并加重，靠明度差说话，完全不动排版。
   * 必须显式 `bg-transparent` —— `<mark>` 自带浏览器默认黄底，只改字重会留下黄块。
   */
  em: "bg-transparent font-medium text-foreground"
}

/**
 * 按查询词给文本加 `<mark>` 命中强调：结果行与顶栏建议共用，保证两处的分段规则一致
 *（多词、忽略大小写、区间合并都在 `highlightSegments` 里）。
 */
export function Highlighted({
  text,
  query,
  variant = "em"
}: {
  text: string
  query: string
  variant?: HighlightVariant
}) {
  return (
    <>
      {highlightSegments(text, query).map((seg, i) =>
        seg.match ? (
          <mark key={i} className={VARIANT_CLASS[variant]}>
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}
