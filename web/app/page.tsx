import type { Metadata } from "next"
import { getAllTopics, getAllTools } from "@/lib/data"
import { ToolBrowser } from "@/components/tool/tool-browser"
import { Hero } from "@/components/hero/hero"

export const metadata: Metadata = {
  alternates: { canonical: "/" },
}

const tools = getAllTools()
const topics = getAllTopics()

export default function Home() {
  return (
    <div className="flex flex-col gap-8">
      <Hero />
      <ToolBrowser tools={tools} topics={topics} />
    </div>
  )
}
