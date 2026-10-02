"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RotateCw, TriangleAlert } from "lucide-react"
import { PageStatus } from "@/components/system/page-status"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <PageStatus
      role="alert"
      code="ERROR"
      media={<TriangleAlert className="size-6" />}
      title="页面出错了"
      description="加载时发生意外错误。可以重试，或返回首页继续浏览。"
      actions={
        <div className="flex items-center gap-2">
          <Button onClick={reset}>
            <RotateCw />
            重试
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            <Home />
            返回首页
          </Link>
        </div>
      }
    />
  )
}
