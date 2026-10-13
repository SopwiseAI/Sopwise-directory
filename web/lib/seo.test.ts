import { describe, it, expect } from "vitest"
import {
  absoluteUrl,
  applicationCategoryFor,
  breadcrumbLd,
  buildCategoryDescription,
  buildToolDescription,
  cjkJoin,
  collectionPageLd,
  itemListLd,
  jsonLdString,
  softwareApplicationLd
} from "./seo"
import { getBaseUrl } from "./utils"
import type { Product } from "./types"

const product: Product = {
  id: "chatgpt",
  name: "ChatGPT",
  description: "OpenAI 推出的智能对话助手。",
  url: "https://chat.openai.com",
  categories: ["chat-assistant"],
  tags: ["对话", "通用"],
  pricing: "freemium",
  createdAt: "2022-11-30"
}

describe("jsonLdString", () => {
  it("转义 < 避免内容里的 </script> 提前闭合脚本标签", () => {
    const out = jsonLdString({ name: "bad</script><script>alert(1)</script>" })
    expect(out).not.toContain("</script>")
    expect(out).toContain("\\u003c")
  })

  it("转义后仍是合法 JSON", () => {
    const value = { "@type": "Thing", name: "a<b" }
    expect(JSON.parse(jsonLdString(value))).toEqual(value)
  })
})

describe("cjkJoin", () => {
  it("在中英交界处补空格", () => {
    expect(cjkJoin("浏览3D 工具类别")).toBe("浏览 3D 工具类别")
    expect(cjkJoin("ChatGPT是助手")).toBe("ChatGPT 是助手")
  })

  it("已经是正确间距的文本不再改动", () => {
    expect(cjkJoin("浏览 3D 工具类别")).toBe("浏览 3D 工具类别")
    expect(cjkJoin("ChatGPT 是助手")).toBe("ChatGPT 是助手")
  })

  it("纯中文不受影响", () => {
    expect(cjkJoin("对话助手与图像生成")).toBe("对话助手与图像生成")
  })
})

describe("absoluteUrl", () => {
  it("站内路径拼成绝对地址", () => {
    expect(absoluteUrl("/tool/chatgpt")).toBe(`${getBaseUrl()}/tool/chatgpt`)
  })

  it("根路径不带尾斜杠（与 canonical 一致）", () => {
    expect(absoluteUrl("/")).toBe(getBaseUrl())
  })
})

describe("applicationCategoryFor", () => {
  it("已知分类映射到 Google 认可的枚举值", () => {
    expect(applicationCategoryFor("chat-assistant")).toBe("UtilitiesApplication")
    expect(applicationCategoryFor("gaming")).toBe("GameApplication")
    expect(applicationCategoryFor("code-tools")).toBe("DeveloperApplication")
  })

  it("未知/缺失分类回落到 UtilitiesApplication", () => {
    expect(applicationCategoryFor("brand-new-category")).toBe("UtilitiesApplication")
    expect(applicationCategoryFor(undefined)).toBe("UtilitiesApplication")
  })
})

describe("breadcrumbLd", () => {
  const crumbs = [
    { label: "全部工具", href: "/" },
    { label: "对话助手", href: "/category/chat-assistant" },
    { label: "ChatGPT" }
  ]
  const currentUrl = `${getBaseUrl()}/tool/chatgpt`

  it("position 从 1 递增，中间项用自身 href", () => {
    const ld = breadcrumbLd(crumbs, currentUrl) as { itemListElement: Record<string, unknown>[] }
    expect(ld.itemListElement.map((i) => i.position)).toEqual([1, 2, 3])
    expect(ld.itemListElement[1].item).toBe(`${getBaseUrl()}/category/chat-assistant`)
  })

  it("末项（无 href）用当前页绝对地址，不留空 item", () => {
    const ld = breadcrumbLd(crumbs, currentUrl) as { itemListElement: Record<string, unknown>[] }
    expect(ld.itemListElement[2].item).toBe(currentUrl)
  })

  it("与可见面包屑同名同序（标记必须描述可见内容）", () => {
    const ld = breadcrumbLd(crumbs, currentUrl) as { itemListElement: { name: string }[] }
    expect(ld.itemListElement.map((i) => i.name)).toEqual(crumbs.map((c) => c.label))
  })
})

describe("itemListLd / collectionPageLd", () => {
  const items = [
    { name: "ChatGPT", url: `${getBaseUrl()}/tool/chatgpt` },
    { name: "Claude", url: `${getBaseUrl()}/tool/claude` }
  ]

  it("ItemList 带 numberOfItems 与递增 position", () => {
    const ld = itemListLd("对话助手", items) as Record<string, unknown>
    expect(ld["@type"]).toBe("ItemList")
    expect(ld.numberOfItems).toBe(2)
    expect((ld.itemListElement as { position: number }[]).map((i) => i.position)).toEqual([1, 2])
  })

  it("CollectionPage 内嵌的 ItemList 不重复带 @context", () => {
    const ld = collectionPageLd({ name: "首页", description: "d", url: getBaseUrl(), items }) as Record<string, unknown>
    expect(ld["@type"]).toBe("CollectionPage")
    expect(ld["@context"]).toBe("https://schema.org")
    expect((ld.mainEntity as Record<string, unknown>)["@context"]).toBeUndefined()
    expect((ld.mainEntity as Record<string, unknown>)["@type"]).toBe("ItemList")
  })
})

describe("softwareApplicationLd", () => {
  const pageUrl = `${getBaseUrl()}/tool/chatgpt`

  it("指向本页 canonical，官方地址放 sameAs", () => {
    const ld = softwareApplicationLd(product, pageUrl) as Record<string, unknown>
    expect(ld.url).toBe(pageUrl)
    expect(ld.sameAs).toBe("https://chat.openai.com")
    expect(ld.operatingSystem).toBe("Web")
  })

  it("freemium 不声明 offers —— 本站只有粗粒度价格档位，不编造报价", () => {
    const ld = softwareApplicationLd(product, pageUrl) as Record<string, unknown>
    expect(ld.offers).toBeUndefined()
  })

  it("paid 同样不声明 offers", () => {
    const ld = softwareApplicationLd({ ...product, pricing: "paid" }, pageUrl) as Record<string, unknown>
    expect(ld.offers).toBeUndefined()
  })

  it("free / opensource 声明 0 价", () => {
    for (const pricing of ["free", "opensource"] as const) {
      const ld = softwareApplicationLd({ ...product, pricing }, pageUrl) as Record<string, unknown>
      expect(ld.offers).toEqual({ "@type": "Offer", price: "0", priceCurrency: "CNY" })
    }
  })

  it("不编造 aggregateRating（本站没有评分数据）", () => {
    const ld = softwareApplicationLd(product, pageUrl) as Record<string, unknown>
    expect(ld.aggregateRating).toBeUndefined()
  })
})

describe("buildToolDescription", () => {
  it("在短描述后补上分类、价格与标签", () => {
    const text = buildToolDescription(product, "对话助手")
    expect(text.startsWith(product.description)).toBe(true)
    expect(text).toContain("ChatGPT 是对话助手类 AI 工具")
    expect(text).toContain("免费+付费")
    expect(text).toContain("擅长 对话、通用")
  })

  it("缺分类名时不出现「类 AI 工具」这种半截话", () => {
    const text = buildToolDescription(product)
    expect(text).toContain("是一款 AI 工具")
    expect(text).not.toContain("类 AI 工具")
  })

  it("英文名与中文之间补空格", () => {
    expect(buildToolDescription(product, "对话助手")).toContain("ChatGPT 是")
  })

  it("无标签时不留多余顿号", () => {
    const text = buildToolDescription({ ...product, tags: undefined }, "对话助手")
    expect(text).not.toContain("擅长")
    expect(text).toContain("免费+付费。")
  })
})

describe("buildCategoryDescription", () => {
  it("带上真实收录数量", () => {
    expect(buildCategoryDescription({ name: "对话助手" }, 7)).toContain("收录 7 款对话助手类")
  })

  it("分类名以英文/数字开头时补空格（回归：「浏览3D 工具类别」）", () => {
    const text = buildCategoryDescription({ name: "3D 工具" }, 3)
    expect(text).toContain("3 款 3D 工具类")
    expect(text).not.toContain("款3D")
  })
})
