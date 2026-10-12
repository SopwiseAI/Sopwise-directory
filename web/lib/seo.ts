import type { Crumb } from "./breadcrumbs"
import { PRICING_LABELS } from "./product"
import type { Category, Product } from "./types"
import { getBaseUrl } from "./utils"

/** 站内路径 → 绝对 URL（JSON-LD 的 `url` / `item` 必须是绝对地址）。 */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl()
  if (path === "/") return base
  return `${base}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * JSON-LD 序列化：转义 `<`，避免产品名/分类名里的 `</script>` 提前闭合脚本标签。
 * 全站 JSON-LD 统一走这里，不要再各页写一遍 `.replace(/</g, "\\u003c")`。
 */
export function jsonLdString(value: unknown): string {
  return JSON.stringify(value).replace(/</g, "\\u003c")
}

/**
 * 中日韩文字与半角英数字交界处补一个空格。
 *
 * 只用于**模板拼接出来的句子**，不要拿去重排上游录入的正文 —— 例如分类名 `3D 工具`
 * 直接拼进「浏览…类别」会得到 `浏览3D 工具类别`（中英挤在一起，SERP 摘要里很显眼）。
 */
export function cjkJoin(text: string): string {
  return text.replace(/([\u4e00-\u9fff])([A-Za-z0-9])/g, "$1 $2").replace(/([A-Za-z0-9])([\u4e00-\u9fff])/g, "$1 $2")
}

/**
 * 可见面包屑 → `BreadcrumbList`。
 *
 * 入参必须是 `resolveCrumbs()` 的返回值 —— 可见面包屑与结构化数据同源，
 * 否则会出现「标记描述了页面上不存在的内容」（Google 结构化数据政策明确禁止）。
 */
export function breadcrumbLd(crumbs: readonly Crumb[], currentUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.label,
      item: crumb.href ? absoluteUrl(crumb.href) : currentUrl
    }))
  }
}

/** 不带 `@context` 的 ItemList 节点，供嵌套进 CollectionPage 使用。 */
function itemListNode(name: string, items: readonly { name: string; url: string }[]): Record<string, unknown> {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url
    }))
  }
}

export function itemListLd(name: string, items: readonly { name: string; url: string }[]): Record<string, unknown> {
  return { "@context": "https://schema.org", ...itemListNode(name, items) }
}

export interface CollectionPageInput {
  name: string
  description: string
  /** 本页绝对 URL。 */
  url: string
  items: readonly { name: string; url: string }[]
}

/** 目录型页面（首页 / 分类索引）：`CollectionPage` + 内嵌 `ItemList`。 */
export function collectionPageLd({ name, description, url, items }: CollectionPageInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url,
    inLanguage: "zh-CN",
    isPartOf: { "@type": "WebSite", name: "XiGee", url: getBaseUrl() },
    mainEntity: itemListNode(name, items)
  }
}

/**
 * 分类 id → schema.org 的 `applicationCategory`。
 *
 * 用 Google 认可的枚举值（BusinessApplication / MultimediaApplication …），
 * 未收录的分类回落到 `UtilitiesApplication`。这是给实体理解用的标注，
 * 不要塞分类中文名 —— 那不在 schema.org 的取值范围内。
 */
const APPLICATION_CATEGORY: Readonly<Record<string, string>> = {
  "chat-assistant": "UtilitiesApplication",
  "image-generation": "MultimediaApplication",
  "code-tools": "DeveloperApplication",
  "writing-tools": "BusinessApplication",
  "video-tools": "MultimediaApplication",
  "audio-tools": "MultimediaApplication",
  productivity: "ProductivityApplication",
  "data-analysis": "BusinessApplication",
  "design-tools": "DesignApplication",
  education: "EducationalApplication",
  marketing: "BusinessApplication",
  translation: "UtilitiesApplication",
  research: "EducationalApplication",
  automation: "BusinessApplication",
  chatbot: "BusinessApplication",
  "3d-tools": "DesignApplication",
  legal: "BusinessApplication",
  finance: "FinanceApplication",
  health: "HealthApplication",
  gaming: "GameApplication"
}

export function applicationCategoryFor(categoryId?: string): string {
  return (categoryId && APPLICATION_CATEGORY[categoryId]) || "UtilitiesApplication"
}

/**
 * 真正「零成本可用」的价格档位才声明 `offers.price = 0`。
 *
 * `freemium` / `paid` 刻意**不写** offers：本站只有粗粒度价格档位，没有真实报价，
 * 编一个金额属于给 Google 喂假数据。宁可拿不到 Software App 富媒体结果，也不伪造。
 */
const FREE_PRICINGS: ReadonlySet<string> = new Set(["free", "opensource"])

/**
 * 产品详情页的 `SoftwareApplication`。
 *
 * - `url` 用本页 canonical（本页就是该工具在本站的落地页），官方地址放 `sameAs`。
 * - 不写 `aggregateRating`：本站没有评分数据，凭空造评分会被判结构化数据作弊。
 */
export function softwareApplicationLd(product: Product, pageUrl: string): Record<string, unknown> {
  const offers =
    product.pricing && FREE_PRICINGS.has(product.pricing)
      ? { "@type": "Offer", price: "0", priceCurrency: "CNY" }
      : undefined

  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description: product.description,
    url: pageUrl,
    applicationCategory: applicationCategoryFor(product.categories[0]),
    operatingSystem: "Web",
    sameAs: product.url,
    ...(offers ? { offers } : {})
  }
}

/**
 * 产品详情页的 meta description。
 *
 * 上游 `product.description` 只有二三十字，单用会在 SERP 里留出大片空白；
 * 这里补上分类、价格档位与标签，拼到 80–110 字。
 */
export function buildToolDescription(product: Product, categoryName?: string): string {
  const pricing = product.pricing ? PRICING_LABELS[product.pricing] : ""
  const tags = product.tags?.length ? `，擅长 ${product.tags.slice(0, 3).join("、")}` : ""
  const categoryClause = categoryName ? `是${categoryName}类 AI 工具` : "是一款 AI 工具"
  const tail = cjkJoin(
    `${product.name}${categoryClause}${pricing ? `，${pricing}` : ""}${tags}。在 XiGee 查看官网入口、分类与标签。`
  )
  return `${product.description.trim()}${tail}`
}

/**
 * 分类页 meta description 的**兜底**文案。
 *
 * 正常情况下用上游 `sd_category.description`（studio 导出）。上游没填时才落到这里 ——
 * 二十个分类共用一句模板是旧版的真实问题，但「没有描述」比「一句丑描述」更糟，
 * 所以保留这个兜底，并至少带上真实收录数量。
 */
export function buildCategoryDescription(category: Pick<Category, "name">, count: number): string {
  return cjkJoin(`XiGee 收录 ${count} 款${category.name}类 AI 工具，人工筛选、持续更新，点击直达官方网站。`)
}
