import { describe, it, expect } from "vitest"
import sitemap from "./sitemap"

/**
 * 回归守卫：sitemap 必须只输出 `/topic/<id>`。
 *
 * `template literal` 里拼 `/category/` 一样能编译、类型检查也不会响，但旧路由是**有意 404** 的 ——
 * sitemap 残留旧前缀等于把爬虫全导向 404，且 CI 上完全不可见。
 */
describe("sitemap", () => {
  it("输出 /topic/<id> 条目", () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls.some((u) => /\/topic\/[^/]+$/.test(u))).toBe(true)
  })

  it("没有任何 /category/ 残留", () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls.filter((u) => u.includes("/category/"))).toEqual([])
  })
})
