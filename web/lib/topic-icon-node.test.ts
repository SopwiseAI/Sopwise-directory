import { describe, it, expect, vi } from "vitest"
import { isValidElement, type ReactElement } from "react"
import { DEFAULT_TOPIC_ICON, resolveTopicIcon, topicIconNode } from "./topic-icon-node"
import topics from "@/data/topics.json"
import type { Topic } from "./types"

const siteTopics = topics as Topic[]

/** 取图标节点渲染出的文本（组件是 `<span>{emoji}</span>`）。 */
function textOf(node: React.ReactNode): string {
  if (!isValidElement(node)) throw new Error("topicIconNode 应返回有效元素")
  return (node as ReactElement<{ children: string }>).props.children
}

describe("resolveTopicIcon", () => {
  it("emoji 原样返回", () => {
    expect(resolveTopicIcon("💬")).toBe("💬")
    expect(resolveTopicIcon("🖼️")).toBe("🖼️")
  })

  it("去掉首尾空白", () => {
    expect(resolveTopicIcon("  🎮  ")).toBe("🎮")
  })

  it.each(["MessageSquare", "message-square", "Box", "Gamepad2"])(
    "旧 Lucide 组件名 %s 回退为默认图标并告警",
    (legacy) => {
      const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
      expect(resolveTopicIcon(legacy)).toBe(DEFAULT_TOPIC_ICON)
      expect(spy).toHaveBeenCalledWith(expect.stringContaining("不是 emoji"))
      spy.mockRestore()
    },
  )

  it("空白值回退为默认图标并告警", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(resolveTopicIcon("   ")).toBe(DEFAULT_TOPIC_ICON)
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})

describe("topicIconNode", () => {
  it("渲染 emoji 文本并带 aria-hidden", () => {
    const node = topicIconNode("💬") as ReactElement<{ "aria-hidden"?: boolean }>
    expect(textOf(node)).toBe("💬")
    expect(node.props["aria-hidden"]).toBe(true)
  })

  it("默认类名用字号而非尺寸类（emoji 靠 font-size 缩放）", () => {
    const node = topicIconNode("💬") as ReactElement<{ className: string }>
    expect(node.props.className).toContain("text-base")
    expect(node.props.className).not.toContain("size-")
  })
})

describe("数据里的主题图标", () => {
  it("topics.json 每个主题图标都匹配 Extended_Pictographic", () => {
    for (const topic of siteTopics) {
      expect(topic.icon, `主题 ${topic.id} 的图标不是 emoji`).toMatch(/\p{Extended_Pictographic}/u)
    }
  })

  it("每个主题图标都能原样解析，不触发回退", () => {
    for (const topic of siteTopics) {
      expect(resolveTopicIcon(topic.icon)).toBe(topic.icon)
    }
  })
})
