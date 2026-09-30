"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-16 text-center">
      <h2 className="text-lg font-semibold tracking-tight">页面出错了</h2>
      <p className="text-sm text-muted-foreground">加载时发生意外错误，可以尝试重新加载</p>
      <Button variant="outline" onClick={reset}>
        重试
      </Button>
    </div>
  )
}
