import type { Metadata } from "next"
import Link from "next/link"
import { Compass, Home, Search } from "lucide-react"
import { getAllCategories } from "@/lib/data"
import { PageStatus } from "@/components/system/page-status"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group"

export const metadata: Metadata = {
  title: "页面未找到",
  robots: { index: false }
}

const categories = getAllCategories()

export default function NotFound() {
  const topCategories = categories.slice(0, 4)

  return (
    <PageStatus
      code="404"
      media={<Compass className="size-6" />}
      title="页面不存在"
      description="你访问的页面可能已被移动或删除。试着搜索，或从下面的分类继续探索。"
      actions={
        <Button variant="outline" render={<Link href="/" />}>
          <Home />
          返回首页
        </Button>
      }
    >
      <form action="/search" method="GET" role="search" className="w-full max-w-sm">
        <InputGroup>
          <InputGroupAddon align="inline-start">
            <Search />
          </InputGroupAddon>
          <InputGroupInput name="q" aria-label="搜索 AI 工具" placeholder="搜索 AI 工具…" />
          <InputGroupAddon align="inline-end">
            <InputGroupButton type="submit">搜索</InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </form>

      <div className="flex flex-wrap justify-center gap-2">
        {topCategories.map((cat) => (
          <Badge key={cat.id} variant="outline" render={<Link href={`/category/${cat.id}`} />}>
            {cat.name}
          </Badge>
        ))}
      </div>
    </PageStatus>
  )
}
