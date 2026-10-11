import { describe, it, expect, beforeEach } from "vitest"
import {
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  normalizeQuery,
  parseRecentSearches,
  RECENT_SEARCH_LIMIT,
  removeRecentSearch
} from "./recent-searches"

describe("normalizeQuery", () => {
  it("去首尾空白并把连续空白压成一个空格", () => {
    expect(normalizeQuery("  图像   生成  ")).toBe("图像 生成")
  })

  it("截断超长查询（挡住把整段文本粘进搜索框）", () => {
    expect(normalizeQuery("a".repeat(200))).toHaveLength(60)
  })
})

describe("parseRecentSearches", () => {
  it("非法 JSON / 非数组一律返回空", () => {
    expect(parseRecentSearches(null)).toEqual([])
    expect(parseRecentSearches("{")).toEqual([])
    expect(parseRecentSearches('{"a":1}')).toEqual([])
  })

  it("丢掉非字符串项并逐条归一化", () => {
    expect(parseRecentSearches('["  图像  ","", 3, null]')).toEqual(["图像"])
  })

  it("按大小写不敏感去重，保留首次出现的位置", () => {
    expect(parseRecentSearches('["ChatGPT","chatgpt","Claude"]')).toEqual(["ChatGPT", "Claude"])
  })

  it("最多保留 RECENT_SEARCH_LIMIT 条", () => {
    const many = JSON.stringify(Array.from({ length: 20 }, (_, i) => `q${i}`))
    expect(parseRecentSearches(many)).toHaveLength(RECENT_SEARCH_LIMIT)
  })
})

describe("recent searches 读写", () => {
  beforeEach(() => localStorage.clear())

  it("最新在前，重复搜索置顶而不新增", () => {
    addRecentSearch("图像")
    addRecentSearch("代码")
    addRecentSearch("图像")
    expect(getRecentSearches()).toEqual(["图像", "代码"])
  })

  it("大小写不敏感去重", () => {
    addRecentSearch("ChatGPT")
    addRecentSearch("chatgpt")
    expect(getRecentSearches()).toEqual(["chatgpt"])
  })

  it("空白查询不写入", () => {
    addRecentSearch("   ")
    expect(getRecentSearches()).toEqual([])
  })

  it("超出上限裁掉最旧", () => {
    for (let i = 0; i < RECENT_SEARCH_LIMIT + 3; i++) addRecentSearch(`q${i}`)
    const list = getRecentSearches()
    expect(list).toHaveLength(RECENT_SEARCH_LIMIT)
    expect(list[0]).toBe(`q${RECENT_SEARCH_LIMIT + 2}`)
    expect(list).not.toContain("q0")
  })

  it("删除单条；不存在时保持原样", () => {
    addRecentSearch("图像")
    addRecentSearch("代码")
    expect(removeRecentSearch("图像")).toEqual(["代码"])
    expect(removeRecentSearch("不存在")).toEqual(["代码"])
  })

  it("清空", () => {
    addRecentSearch("图像")
    expect(clearRecentSearches()).toEqual([])
    expect(getRecentSearches()).toEqual([])
  })
})
