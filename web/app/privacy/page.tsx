import type { Metadata } from "next"
import Link from "next/link"
import { InfoLayout, InfoSection } from "@/components/info/info-shell"

export const metadata: Metadata = {
  title: "隐私政策",
  description: "XiGee 隐私政策：我们不收集个人信息；主题、浏览偏好与访问历史仅保存在你的浏览器本地。",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "隐私政策", description: "XiGee 如何处理（以及不处理）你的数据" }
}

export default function PrivacyPage() {
  return (
    <InfoLayout
      title="隐私政策"
      description="简短版：XiGee 无账号、无追踪，你的偏好与历史只保存在本机浏览器。"
      updated="2026-10-02"
    >
      <InfoSection title="我们收集什么">
        <p>
          XiGee 不设账号，不使用分析或广告
          SDK，不收集、不上传任何可识别你个人身份的信息。因此也没有可供导出的服务端个人数据。
        </p>
      </InfoSection>

      <InfoSection title="保存在你浏览器里的数据">
        <p>下列数据仅写入你设备的 localStorage，不会发送到任何服务器；清除浏览器数据即会消失：</p>
        <ul>
          <li>
            <span className="text-foreground">主题</span>：亮色 / 暗色 / 跟随系统。
          </li>
          <li>
            <span className="text-foreground">侧边栏折叠状态</span>。
          </li>
          <li>
            <span className="text-foreground">浏览偏好</span>：默认视图、排序与 Tab。
          </li>
          <li>
            <span className="text-foreground">访问历史</span>：你在站内点击过的产品名称、链接与访问时间。
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="Cookie 与追踪">
        <p>本站不设置用于追踪或广告的 Cookie，也不进行跨站跟踪。基础功能所需的状态均以上述 localStorage 实现。</p>
      </InfoSection>

      <InfoSection title="第三方链接">
        <p>
          XiGee
          收录的产品均指向第三方网站。离开本站后，你对目标网站的使用受其各自的隐私政策与条款约束，本站无法控制也不承担责任。
        </p>
      </InfoSection>

      <InfoSection title="你的选择">
        <p>
          你可以随时在{" "}
          <Link href="/settings" className="text-foreground underline-offset-4 hover:underline">
            设置
          </Link>{" "}
          中导出、导入或清空访问历史，并重置外观与浏览偏好；也可直接清除浏览器的站点数据。
        </p>
      </InfoSection>

      <InfoSection title="政策变更">
        <p>本政策如有更新，将在此页公示并同步更新「最后更新」日期。</p>
      </InfoSection>
    </InfoLayout>
  )
}
