import { describe, it, expect } from "vitest"
import { isValidSort, isValidView, readUrlParams } from "./product-query"

describe("readUrlParams", () => {
  it("空查询返回全 null", () => {
    expect(readUrlParams("")).toEqual({ tab: null, view: null, sort: null })
  })

  it("解析合法 tab/view/sort", () => {
    expect(readUrlParams("?tab=featured&view=list&sort=name-asc")).toEqual({
      tab: "featured",
      view: "list",
      sort: "name-asc"
    })
  })

  it("兼容旧版 filter 别名：featured → featured，latest → all", () => {
    expect(readUrlParams("?filter=featured").tab).toBe("featured")
    expect(readUrlParams("?filter=latest").tab).toBe("all")
  })

  it("tab 优先于 filter 别名", () => {
    expect(readUrlParams("?tab=latest&filter=featured").tab).toBe("latest")
  })

  it("非法值归一化为 null", () => {
    expect(readUrlParams("?tab=bogus&view=bogus&sort=bogus")).toEqual({
      tab: null,
      view: null,
      sort: null
    })
  })
})

describe("isValidView / isValidSort", () => {
  it("识别合法展示偏好", () => {
    expect(isValidView("grid")).toBe(true)
    expect(isValidView("list")).toBe(true)
    expect(isValidView("bogus")).toBe(false)
    expect(isValidSort("latest")).toBe(true)
    expect(isValidSort("name-desc")).toBe(true)
    expect(isValidSort("bogus")).toBe(false)
  })
})
