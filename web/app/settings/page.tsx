import type { Metadata } from "next"
import { getStats } from "@/lib/data"
import { SettingsView } from "@/components/settings/settings-view"
import pkg from "@/package.json"

export const metadata: Metadata = {
  title: "设置",
  description: "XiGee 设置：外观、浏览偏好、数据与隐私、关于与版本、快捷键",
  // noindex 页面不声明 canonical：索引已拒绝收录，再给规范地址属于多余信号
  openGraph: {
    title: "设置",
    description: "XiGee 设置：外观、浏览偏好、数据与隐私、关于与版本、快捷键"
  },
  robots: { index: false, follow: true }
}

const stats = getStats()

export default function SettingsPage() {
  return <SettingsView version={pkg.version} stats={stats} />
}
