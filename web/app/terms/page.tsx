import type { Metadata } from "next"
import Link from "next/link"
import { InfoLayout, type InfoSectionDef } from "@/components/info/info-shell"

export const metadata: Metadata = {
  title: "服务条款",
  description: "XiGee 服务条款：本站内容仅供参考，收录工具与链接由第三方提供，使用风险自负。",
  alternates: { canonical: "/terms" },
  openGraph: { title: "服务条款", description: "使用 XiGee 前请阅读的条款与免责声明" }
}

const sections: InfoSectionDef[] = [
  {
    id: "nature",
    title: "内容性质",
    body: (
      <p>
        XiGee 是一个 AI
        工具导航与发现站点，所展示的工具信息（名称、简介、分类、价格标注等）来自公开数据与整理，仅供参考，不构成任何专业建议或推荐担保。
      </p>
    )
  },
  {
    id: "third-party",
    title: "第三方链接与内容",
    body: (
      <p>
        本站收录的工具均直接跳转第三方网站。我们无法控制这些网站的内容、可用性、安全性或合法性，也不对其提供的服务与工具负责。你与第三方之间的任何交互与风险，由你自行承担。
      </p>
    )
  },
  {
    id: "no-warranty",
    title: "无担保",
    body: (
      <p>
        本站按「现状」提供，不对信息的准确性、完整性、时效性作任何明示或默示担保。因使用本站或其收录内容而产生的任何损失，本站不承担责任。
      </p>
    )
  },
  {
    id: "ip",
    title: "知识产权",
    body: (
      <p>
        本站的名称、标识与页面设计归 XiGee
        所有。被收录工具的名称、图标与商标归各自所有者所有，本站仅用于识别与说明用途。
      </p>
    )
  },
  {
    id: "acceptable-use",
    title: "可接受使用",
    body: <p>请勿以任何方式滥用本站，包括但不限于抓取攻击、干扰服务运行或用于违法用途。</p>
  },
  {
    id: "changes",
    title: "条款变更",
    body: (
      <p>
        我们可能不定期更新本条款，更新后在本页公示并同步更新「最后更新」日期，继续使用即视为接受。相关数据处理方式见{" "}
        <Link href="/privacy" className="text-foreground underline-offset-4 hover:underline">
          隐私政策
        </Link>
        。
      </p>
    )
  }
]

export default function TermsPage() {
  return (
    <InfoLayout
      title="服务条款"
      description="使用 XiGee 即表示你理解并接受以下条款。"
      updated="2026-10-02"
      sections={sections}
    />
  )
}
