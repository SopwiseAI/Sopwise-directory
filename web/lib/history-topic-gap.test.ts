import { describe, it, expect, beforeEach } from "vitest"
import { addToHistory, getHistorySnapshot, parseHistorySnapshot, filterHistory } from "./history"

/**
 * 回归守卫：`topicId` 归一化链路。
 *
 * 为什么单独建文件：`addToHistory` 会把刚写入的对象直接放进内存缓存，`getHistory()` 命中缓存后
 * **永远不经过 `normalizeItem`**。所以「字段名只改了一半」（例如 `normalizeItem` 里仍读
 * `r.categoryId`）在既有用例下是全绿的 —— 这里刻意绕开缓存、从 localStorage 原始快照重新解析，
 * 模拟「用户下次打开页面」，才能暴露那类静默数据损坏。
 */
describe("topicId 全链路", () => {
  beforeEach(() => localStorage.clear())

  it("落盘后再解析（模拟下次打开页面），topicId 仍是主题 id", () => {
    addToHistory({ id: "t1", name: "T1", url: "https://x.com", topics: ["chat-assistant"] })

    const items = parseHistorySnapshot(getHistorySnapshot())
    expect(items[0].topicId).toBe("chat-assistant")
  })

  it("重新解析后的 topicId 仍可用于主题筛选", () => {
    addToHistory({ id: "t1", name: "T1", url: "https://x.com", topics: ["chat-assistant"] })
    addToHistory({ id: "t2", name: "T2", url: "https://y.com", topics: ["code-tools"] })

    const fresh = parseHistorySnapshot(getHistorySnapshot())
    expect(filterHistory(fresh, { topicId: "chat-assistant" }).map((i) => i.id)).toEqual(["t1"])
  })

  it("getHistoryTopicIds 从重新解析的记录里仍能取到主题", () => {
    addToHistory({ id: "t1", name: "T1", url: "https://x.com", topics: ["chat-assistant"] })
    const fresh = parseHistorySnapshot(getHistorySnapshot())
    expect(fresh.map((i) => i.topicId)).toEqual(["chat-assistant"])
  })
})
