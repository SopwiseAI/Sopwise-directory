import type { Metadata } from "next"
import { getStats } from "@/lib/data"
import { SettingsView } from "@/components/settings/settings-view"
import { Toaster } from "@/components/ui/sonner"
import pkg from "@/package.json"

export const metadata: Metadata = {
  title: "设置",
  description: "XiGee 设置：外观、浏览偏好、数据与隐私、关于与版本、快捷键",
  // noindex 页面不声明 canonical：索引已拒绝收录，再给规范地址属于多余信号
  openGraph: {
    title: "设置",
    description: "XiGee 设置：外观、浏览偏好、数据与隐私、关于与版本、快捷键",
  },
  robots: { index: false, follow: true },
}

const stats = getStats()

export default function SettingsPage() {
  return (
    <>
      <SettingsView version={pkg.version} stats={stats} />
      {/* Toast 出口只挂在设置页：全站唯一会 toast 的地方是「数据与隐私」的导出/导入/清空。
          挂在根布局会让 sonner 进每个页面的首屏包，而其它页一次都用不到。 */}
      <Toaster />
    </>
  )
}
