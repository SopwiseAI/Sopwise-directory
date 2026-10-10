import type { Metadata } from "next"
import Link from "next/link"
import { History, Palette, PanelLeft, SlidersHorizontal, type LucideIcon } from "lucide-react"
import { InfoLayout, type InfoSectionDef } from "@/components/info/info-shell"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

export const metadata: Metadata = {
  title: "隐私政策",
  description: "XiGee 隐私政策：无账号、无埋点、无 Cookie；主题、浏览偏好与历史记录只保存在你的浏览器本地。",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "隐私政策", description: "XiGee 如何处理（以及不处理）你的数据" }
}

/** 仅存于本机浏览器、永不上传的数据清单 */
const LOCAL_DATA: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Palette, title: "主题", description: "亮色、暗色或跟随系统" },
  { icon: PanelLeft, title: "侧边栏折叠状态", description: "左栏是展开还是收起" },
  { icon: SlidersHorizontal, title: "浏览偏好", description: "默认视图、排序与首页筛选" },
  {
    icon: History,
    title: "历史记录",
    description: "你点开过的工具名称、官网链接、所属分类、价格标记、访问次数与最近访问时间"
  }
]

const sections: InfoSectionDef[] = [
  {
    id: "what-we-collect",
    title: "我们收集什么",
    body: (
      <>
        <p>XiGee 不设账号，也没有接入任何分析或广告 SDK —— 站点里没有埋点，不会把你的浏览行为上报给任何人。</p>
        <p>也正因为不需要，我们没有自己的后端数据库：你看到的目录数据在构建时就固化成了静态文件。</p>
      </>
    )
  },
  {
    id: "local-data",
    title: "保存在你浏览器里的数据",
    body: (
      <>
        <p>下列数据仅写入你设备的 localStorage，不会发送到任何服务器；清除浏览器数据即会消失：</p>
        <ItemGroup className="gap-0.5">
          {LOCAL_DATA.map(({ icon: Icon, title, description }) => (
            <Item key={title} className="px-0">
              <ItemMedia variant="icon">
                <Icon aria-hidden />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription>{description}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </ItemGroup>
      </>
    )
  },
  {
    id: "hosting",
    title: "托管与日志",
    body: (
      <p>
        本站部署在 Vercel。与所有网站一样，托管平台会按行业惯例记录基础访问日志（例如 IP
        地址、User-Agent）用于安全防护与故障排查。本站代码不接触、不保存这类日志，也不用于识别个人身份或做用户画像。
      </p>
    )
  },
  {
    id: "cookies",
    title: "Cookie 与追踪",
    body: (
      <p>
        本站自身不设置任何 Cookie，也不做跨站跟踪 ——
        你的浏览器里没有任何用于追踪你的标识。基础功能所需的状态，全部写在上面列出的 localStorage 里。
      </p>
    )
  },
  {
    id: "third-party",
    title: "第三方链接",
    body: (
      <p>
        XiGee
        收录的工具均指向第三方网站。离开本站后，你对目标网站的使用受其各自的隐私政策与条款约束，本站无法控制也不承担责任。
      </p>
    )
  },
  {
    id: "your-choices",
    title: "你的选择",
    body: (
      <>
        <p>
          你可以随时在{" "}
          <Link href="/settings" className="text-foreground underline-offset-4 hover:underline">
            设置
          </Link>{" "}
          中导出、导入或清空历史记录，并重置外观与浏览偏好。
        </p>
        <p>
          想在浏览器里直接确认或删除这些数据，可以在开发者工具里搜索 <code className="font-data">xigee:</code>{" "}
          前缀；也可以直接清除本站的站点数据，效果一样。
        </p>
      </>
    )
  },
  {
    id: "policy-changes",
    title: "政策变更",
    body: <p>本政策如有更新，将在此页公示并同步更新「最后更新」日期。</p>
  }
]

export default function PrivacyPage() {
  return (
    <InfoLayout
      title="隐私政策"
      description="简短版：XiGee 无账号、无埋点、无 Cookie，你的偏好与浏览记录只保存在本机浏览器。"
      updated="2026-10-10"
      sections={sections}
    />
  )
}
