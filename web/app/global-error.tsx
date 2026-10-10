"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Home, RotateCw, TriangleAlert } from "lucide-react"
import { PageStatus } from "@/components/system/page-status"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BRAND_PAGE } from "@/lib/brand"
import "./globals.css"

/**
 * 根布局级错误边界：连 <html>/<body> 都由它自行渲染（根 layout 已经崩了，
 * 不会再套外壳）。只在「layout.tsx 自身抛错」时触发，日常错误走 app/error.tsx。
 * 主题色用 BRAND_PAGE 内联兜底——此时 <head> 里的偏好脚本可能根本没执行过。
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="zh-CN" style={{ colorScheme: "light dark" }}>
      <head>
        <meta name="theme-color" content={BRAND_PAGE.light} />
      </head>
      <body className="min-h-full bg-background text-foreground antialiased">
        <PageStatus
          role="alert"
          code="ERROR"
          media={<TriangleAlert className="size-6" />}
          title="站点出错了"
          description="初始化时发生意外错误。可以重试，或返回首页继续浏览。"
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
      </body>
    </html>
  )
}
