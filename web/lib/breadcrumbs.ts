import type { Category, Product } from "./types"
import { categoryHref } from "./url"

export interface Crumb {
  label: string
  href?: string
}

/**
 * 面包屑首项文案。可见面包屑与 `BreadcrumbList` 结构化数据共用此常量 ——
 * 两处各写一套字符串，迟早会出现「顶栏写 A、JSON-LD 写 B」的漂移。
 */
export const HOME_CRUMB_LABEL = "全部工具"

/** 分类索引页（`/category`）在面包屑里的短标签；页面自身的 h1 是「AI 工具分类」。 */
export const CATEGORY_HUB_CRUMB_LABEL = "分类"

/**
 * 面包屑数据源。刻意只取用得到的字段：顶栏可以直接复用根布局已下发的 `SuggestionDoc`
 * （它有 id/name/categories），不必为了面包屑再传一份产品列表。
 */
export interface CrumbSources {
  categories?: readonly Pick<Category, "id" | "name">[]
  products?: readonly Pick<Product, "id" | "name" | "categories">[]
}

/**
 * `pathname` → 面包屑。
 *
 * **可见面包屑（`MainHeader`）与 `BreadcrumbList` 结构化数据必须共用这一个函数**：
 * Google 的结构化数据政策要求标记描述用户可见的内容，两处分别计算迟早会不一致。
 *
 * 末项不带 `href`（当前页不自链），中间项可点。
 */
export function resolveCrumbs(pathname: string, sources: CrumbSources = {}): Crumb[] {
  const { categories = [], products = [] } = sources
  const home: Crumb = { label: HOME_CRUMB_LABEL, href: "/" }
  const hub: Crumb = { label: CATEGORY_HUB_CRUMB_LABEL, href: "/category" }
  const rootOnly: Crumb[] = [{ label: HOME_CRUMB_LABEL }]

  if (pathname === "/category") return [home, { label: CATEGORY_HUB_CRUMB_LABEL }]

  if (pathname.startsWith("/category/")) {
    const id = pathname.slice("/category/".length)
    const name = categories.find((c) => c.id === id)?.name
    // 中间层指向 /category —— 分类索引页因此拿到 20 条站内链接，而不是只能靠侧栏被发现
    return name ? [home, hub, { label: name }] : [home, hub]
  }

  if (pathname.startsWith("/tool/")) {
    const slug = pathname.slice("/tool/".length)
    const product = products.find((p) => p.id === slug)
    if (!product) return rootOnly
    const categoryId = product.categories[0]
    const categoryName = categoryId ? categories.find((c) => c.id === categoryId)?.name : undefined
    if (!categoryId || !categoryName) return [home, { label: product.name }]
    return [home, { label: categoryName, href: categoryHref(categoryId) }, { label: product.name }]
  }

  if (pathname === "/search") return [{ label: "搜索" }]
  if (pathname === "/history") return [{ label: "历史记录" }]
  if (pathname === "/settings") return [{ label: "设置" }]
  if (pathname === "/about") return [{ label: "关于" }]
  if (pathname === "/privacy") return [{ label: "隐私政策" }]
  if (pathname === "/terms") return [{ label: "服务条款" }]
  return rootOnly
}
