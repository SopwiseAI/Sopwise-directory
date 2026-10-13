import { describe, it, expect } from "vitest"
import { CATEGORY_HUB_CRUMB_LABEL, HOME_CRUMB_LABEL, resolveCrumbs } from "./breadcrumbs"

const categories = [
  { id: "chat-assistant", name: "对话助手" },
  { id: "3d-tools", name: "3D 工具" }
]

const products = [
  { id: "chatgpt", name: "ChatGPT", categories: ["chat-assistant"] },
  { id: "orphan", name: "Orphan", categories: [] },
  { id: "stale", name: "Stale", categories: ["removed-category"] }
]

const sources = { categories, products }

describe("resolveCrumbs", () => {
  it("首页只有一项「全部工具」且末项不自链", () => {
    const crumbs = resolveCrumbs("/", sources)
    expect(crumbs).toEqual([{ label: HOME_CRUMB_LABEL }])
  })

  it("分类索引页挂在首页之下", () => {
    expect(resolveCrumbs("/category", sources)).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: CATEGORY_HUB_CRUMB_LABEL }
    ])
  })

  it("分类页三级：首页 → 分类索引 → 分类名", () => {
    expect(resolveCrumbs("/category/chat-assistant", sources)).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: CATEGORY_HUB_CRUMB_LABEL, href: "/category" },
      { label: "对话助手" }
    ])
  })

  it("分类页中间层指向 /category —— 分类索引页因此拿到站内链接", () => {
    const crumbs = resolveCrumbs("/category/3d-tools", sources)
    expect(crumbs[1].href).toBe("/category")
  })

  it("未知分类 id 退化为 首页 → 分类索引（不产生悬空项）", () => {
    expect(resolveCrumbs("/category/does-not-exist", sources)).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: CATEGORY_HUB_CRUMB_LABEL, href: "/category" }
    ])
  })

  it("产品页三级：首页 → 所属分类 → 产品名", () => {
    expect(resolveCrumbs("/tool/chatgpt", sources)).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: "对话助手", href: "/category/chat-assistant" },
      { label: "ChatGPT" }
    ])
  })

  it("产品无分类时退化为 首页 → 产品名", () => {
    expect(resolveCrumbs("/tool/orphan", sources)).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: "Orphan" }
    ])
  })

  it("产品引用了已消失的分类时退化为 首页 → 产品名", () => {
    expect(resolveCrumbs("/tool/stale", sources)).toEqual([{ label: HOME_CRUMB_LABEL, href: "/" }, { label: "Stale" }])
  })

  it("未知产品 slug 退化为单项首页", () => {
    expect(resolveCrumbs("/tool/nope", sources)).toEqual([{ label: HOME_CRUMB_LABEL }])
  })

  it("信息页/搜索页等单层路由不带首页前缀", () => {
    expect(resolveCrumbs("/search")).toEqual([{ label: "搜索" }])
    expect(resolveCrumbs("/history")).toEqual([{ label: "历史记录" }])
    expect(resolveCrumbs("/settings")).toEqual([{ label: "设置" }])
    expect(resolveCrumbs("/about")).toEqual([{ label: "关于" }])
    expect(resolveCrumbs("/privacy")).toEqual([{ label: "隐私政策" }])
    expect(resolveCrumbs("/terms")).toEqual([{ label: "服务条款" }])
  })

  it("任何路由下末项都没有 href（当前页不自链）", () => {
    const paths = ["/", "/category", "/category/chat-assistant", "/tool/chatgpt", "/tool/orphan", "/search"]
    for (const path of paths) {
      const crumbs = resolveCrumbs(path, sources)
      expect(crumbs.at(-1)?.href, `末项不应带 href: ${path}`).toBeUndefined()
    }
  })

  it("缺省数据源不抛错（顶栏首帧可能还没拿到分类/产品）", () => {
    expect(resolveCrumbs("/category/chat-assistant")).toEqual([
      { label: HOME_CRUMB_LABEL, href: "/" },
      { label: CATEGORY_HUB_CRUMB_LABEL, href: "/category" }
    ])
    expect(resolveCrumbs("/tool/chatgpt")).toEqual([{ label: HOME_CRUMB_LABEL }])
  })
})
