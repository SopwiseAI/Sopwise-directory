import { describe, it, expect } from "vitest"
import { CATEGORY_ICONS, categoryIconNode } from "./category-icon-node"
import data from "@/data/data.json"
import type { SiteData } from "./types"

const siteData = data as SiteData

describe("categoryIconNode", () => {
  it("returns icon node for valid icon name", () => {
    const node = categoryIconNode("MessageSquare")
    expect(node).not.toBeNull()
  })

  it("returns null for unknown icon name", () => {
    expect(categoryIconNode("NonExistent")).toBeNull()
  })

  it("all category icons in data.json exist in iconMap", () => {
    for (const cat of siteData.categories) {
      expect(CATEGORY_ICONS).toHaveProperty(cat.icon)
    }
  })

  it("iconMap has at least as many entries as data.json categories", () => {
    expect(Object.keys(CATEGORY_ICONS).length).toBeGreaterThanOrEqual(siteData.categories.length)
  })
})
