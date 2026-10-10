"use client"

import { useRef, useState } from "react"
import { Download, RotateCcw, Trash2, Upload } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Field, FieldContent, FieldDescription, FieldGroup, FieldTitle } from "@/components/ui/field"
import { useHistoryCount } from "@/components/history/history-count"
import { Skeleton } from "@/components/ui/skeleton"
import { setTheme } from "@/lib/theme"
import { clearHistory, getHistoryExport, importHistory } from "@/lib/history"
import { resetPreferences } from "@/lib/preferences"
import { formatCount } from "@/lib/format"

/** 挂载前骨架：文案是静态的照常渲染，只把数量与按钮换成骨架，避免首帧跳动。 */
function DataControlsSkeleton() {
  return (
    <FieldGroup aria-hidden>
      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>历史记录</FieldTitle>
          {/* FieldDescription 是 <p>，里面不能放 Skeleton（div）—— 骨架直接替换整行说明 */}
          <Skeleton className="h-3.5 w-64 rounded" />
        </FieldContent>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-7 w-20 rounded-lg" />
        </div>
      </Field>
      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>重置偏好</FieldTitle>
          <FieldDescription>将外观与浏览偏好恢复默认，不影响历史记录。</FieldDescription>
        </FieldContent>
        <Skeleton className="h-7 w-20 rounded-lg" />
      </Field>
    </FieldGroup>
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
    <FieldGroup>
      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>历史记录</FieldTitle>
          <FieldDescription>当前 {formatCount(count)} 条，仅保存在本机浏览器，不会上传。</FieldDescription>
        </FieldContent>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={count === 0}>
            <Download data-icon="inline-start" />
            导出 JSON
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
            <Upload data-icon="inline-start" />
            导入 JSON
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)} disabled={count === 0}>
            <Trash2 data-icon="inline-start" />
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
      </Field>

      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>重置偏好</FieldTitle>
          <FieldDescription>将外观与浏览偏好恢复默认，不影响历史记录。</FieldDescription>
        </FieldContent>
        <Button variant="outline" size="sm" onClick={() => setResetOpen(true)}>
          <RotateCcw data-icon="inline-start" />
          恢复默认
        </Button>
      </Field>

      {/* 操作结果就地反馈（role=status 而非 alert：非紧急、不抢焦点） */}
      {status && (
        <Alert role="status" aria-live="polite">
          <AlertDescription>{status}</AlertDescription>
        </Alert>
      )}

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
    </FieldGroup>
  )
}
