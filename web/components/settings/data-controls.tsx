"use client"

import { useRef, useState } from "react"
import { Download, RotateCcw, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { useHistoryCount } from "@/components/history/history-count"
import { Skeleton } from "@/components/ui/skeleton"
import { setTheme } from "@/lib/theme"
import { clearHistory, getHistoryExport, importHistory } from "@/lib/history"
import { resetPreferences } from "@/lib/preferences"
import { formatCount } from "@/lib/format"

function DataControlsSkeleton() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3 w-52 rounded" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2 border-t border-border pt-4">
        <Skeleton className="h-3.5 w-16 rounded" />
        <Skeleton className="h-3 w-44 rounded" />
        <Skeleton className="h-7 w-24 rounded-lg" />
      </div>
    </div>
  )
}

/** 数据与隐私：历史导出/导入/清空 + 偏好重置。全部仅在本机 localStorage 完成。 */
export function DataControls({ mounted }: { mounted: boolean }) {
  const count = useHistoryCount()
  const fileRef = useRef<HTMLInputElement>(null)
  const [clearOpen, setClearOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [status, setStatus] = useState("")

  if (!mounted) return <DataControlsSkeleton />

  const handleExport = () => {
    try {
      const blob = new Blob([getHistoryExport()], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "")
      a.href = url
      a.download = `xigee-history-${stamp}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      // 延迟释放：部分浏览器（Firefox/Safari）在同步 revoke 时可能尚未取用 blob，导致下载被取消
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setStatus(`已导出 ${formatCount(count)} 条记录`)
    } catch {
      setStatus("导出失败：当前浏览器不支持下载")
    }
  }

  const handleImport = async (file: File | undefined) => {
    if (!file) return
    try {
      const text = await file.text()
      const result = importHistory(text)
      setStatus(
        result.error
          ? `导入失败：${result.error}`
          : `导入完成：新增 ${formatCount(result.imported)} 条，跳过 ${formatCount(result.skipped)} 条，共 ${formatCount(result.total)} 条`
      )
    } catch {
      setStatus("导入失败：无法读取文件")
    } finally {
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  const handleReset = () => {
    resetPreferences()
    setTheme("system")
    setStatus("已恢复默认外观与浏览偏好")
  }

  return (
    <div className="space-y-5">
      {/* 容器够宽时两块并排铺满卡片，避免右侧留一大片空白；窄屏仍是上下堆叠 */}
      <div className="@3xl:grid @3xl:grid-cols-2 @3xl:items-start @3xl:gap-8">
        <div className="space-y-2">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">历史记录</p>
            <p className="text-xs text-muted-foreground">
              当前 {formatCount(count)} 条，仅保存在本机浏览器，不会上传。
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} disabled={count === 0}>
              <Download />
              导出 JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
              <Upload />
              导入 JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearOpen(true)}
              disabled={count === 0}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
              清空历史
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              tabIndex={-1}
              aria-label="选择要导入的历史 JSON 文件"
              onChange={(e) => handleImport(e.target.files?.[0])}
            />
          </div>
        </div>

        <div className="space-y-2 border-t border-border pt-4 @3xl:border-l @3xl:border-t-0 @3xl:pl-8 @3xl:pt-0">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-foreground">重置偏好</p>
            <p className="text-xs text-muted-foreground">将外观与浏览偏好恢复默认，不影响历史记录。</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
            <RotateCcw />
            恢复默认
          </Button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="min-h-4 font-data text-xs text-muted-foreground">
        {status}
      </p>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清空所有历史记录？</AlertDialogTitle>
            <AlertDialogDescription>此操作不可恢复，共 {count} 条记录</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                clearHistory()
                setStatus("已清空全部历史记录")
              }}
            >
              确定清空
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>恢复默认外观与浏览偏好？</AlertDialogTitle>
            <AlertDialogDescription>
              主题将回到「跟随系统」，视图/排序/Tab 回到默认。历史记录不受影响。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>恢复默认</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
