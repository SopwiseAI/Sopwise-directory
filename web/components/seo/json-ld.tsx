import { jsonLdString } from "@/lib/seo"

/**
 * JSON-LD 注入出口。全站结构化数据统一走这个组件，别在各页手写
 * `<script type="application/ld+json" dangerouslySetInnerHTML=…>` ——
 * 那样每页都要自己记得转义 `<`（漏一次就可能被内容里的 `</script>` 提前闭合）。
 */
export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
}
