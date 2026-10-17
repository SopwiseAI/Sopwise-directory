import Link from "next/link"
import { topicIconNode } from "@/lib/topic-icon-node"
import { formatCount } from "@/lib/format"
import type { Topic } from "@/lib/types"

interface TopicBrowseProps {
  topics: readonly Topic[]
  topicCounts: Record<string, number>
}

/** 主题浏览网格：搜索的兜底出口，给「不知道搜什么」的用户一条按主题走的路。 */
export function TopicBrowse({ topics, topicCounts }: TopicBrowseProps) {
  const list = topics.filter((t) => (topicCounts[t.id] ?? 0) > 0)
  if (list.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
        按主题浏览
        <span className="font-data text-xs font-normal text-muted-foreground">TOPICS</span>
      </h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
        {list.map((topic) => (
          <Link
            key={topic.id}
            href={`/topic/${topic.id}`}
            className="flex items-center gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors outline-none hover:border-brand/30 hover:bg-brand/[0.03] focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background text-muted-foreground">
              {topicIconNode(topic.icon, "text-base leading-none shrink-0")}
            </span>
            <span className="min-w-0 flex-1 truncate font-medium">{topic.name}</span>
            <span className="shrink-0 font-data text-xs text-muted-foreground">
              {formatCount(topicCounts[topic.id] ?? 0)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
