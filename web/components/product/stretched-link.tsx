import Link from "next/link"
import { toolHref } from "@/lib/url"
import { cn } from "@/lib/utils"

/**
 * 铺满整张卡片的点击热区（stretched link）。
 *
 * 卡片外壳从 `<a>` 变成容器之后，用标题链接的 `::after` 铺满整卡：点卡片任意处进详情页，
 * 而右上角的官网箭头抬到 `z-10` 之上，仍然是独立的出站链接 —— 两个目标不再互相嵌套
 * （`<a>` 套 `<a>` 是非法 HTML）。
 *
 * **`truncate` 必须放在内层 `<span>` 上**：`overflow: hidden` 会把 `::after` 一并裁掉，
 * 热区就只剩标题那一小条了。同理，热区路径上不能有别的 `overflow: hidden` 祖先。
 */
export function StretchedProductLink({ id, name, className }: { id: string; name: string; className?: string }) {
  return (
    <Link
      href={toolHref(id)}
      className={cn(
        "outline-none after:absolute after:inset-0 after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-ring",
        className
      )}
    >
      <span className="block truncate">{name}</span>
    </Link>
  )
}
