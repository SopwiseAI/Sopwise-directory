import { highlightSegments } from "@/lib/search"

/**
 * 按查询词给文本加 `<mark>` 高亮：结果行与顶栏建议共用，保证两处的分段规则一致
 *（多词、忽略大小写、区间合并都在 `highlightSegments` 里）。
 */
export function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightSegments(text, query).map((seg, i) =>
        seg.match ? (
          <mark key={i} className="rounded-sm bg-brand/15 px-0.5 text-foreground">
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  )
}
