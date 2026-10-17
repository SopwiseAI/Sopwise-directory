import { describe, it, expect, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { HistoryTracker } from "@/components/runtime/history-tracker"
import { getHistory } from "@/lib/history"
import { toolHistoryAttrs } from "@/lib/tool"

/**
 * 回归守卫：`data-history-*` 属性的**读取侧**。
 *
 * 写入侧在 `lib/tool.test.ts` 有断言，但读取侧（`HistoryTracker` 的 `dataset.historyTopic`）此前
 * 零覆盖：把 `historyTopic` 写成 `historyTopics`（改名时最典型的手滑）不会有任何测试变红，
 * 后果是**所有**工具链接回写历史时主题信息全丢，且不报错。
 */
describe("HistoryTracker DOM 属性往返", () => {
  beforeEach(() => localStorage.clear())

  it("data-history-topic → history.topicId 配对", () => {
    render(
      <>
        <HistoryTracker />
        <a
          href="https://x.com"
          {...toolHistoryAttrs({
            id: "t1",
            name: "T1",
            url: "https://x.com",
            topics: ["chat-assistant"],
            pricing: "free",
          })}
        >
          link
        </a>
      </>,
    )

    fireEvent.click(screen.getByText("link"))

    expect(getHistory()[0]).toMatchObject({ id: "t1", topicId: "chat-assistant", pricing: "free" })
  })

  it("中键（auxclick）也记录，且主题同样落到 topicId", () => {
    render(
      <>
        <HistoryTracker />
        <a
          href="https://y.com"
          {...toolHistoryAttrs({ id: "t2", name: "T2", url: "https://y.com", topics: ["code-tools"] })}
        >
          mid
        </a>
      </>,
    )

    // fireEvent 没有 auxClick helper，直接派发原生事件（中键「新标签打开」走 auxclick）
    fireEvent(screen.getByText("mid"), new MouseEvent("auxclick", { bubbles: true, button: 1 }))

    expect(getHistory()[0]).toMatchObject({ id: "t2", topicId: "code-tools" })
  })
})
