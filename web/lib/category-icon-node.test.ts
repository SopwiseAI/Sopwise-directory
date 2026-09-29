import { describe, it, expect, vi } from "vitest"
import { CATEGORY_ICONS, categoryIconNode } from "./category-icon-node"
import data from "@/data/data.json"
import type { SiteData } from "./types"

const siteData = data as SiteData

describe("categoryIconNode", () => {
  it("returns icon node for valid icon name", () => {
    const node = categoryIconNode("MessageSquare")
    expect(node).not.toBeNull()
  })

  it("returns null and warns for unknown icon name", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(categoryIconNode("NonExistent")).toBeNull()
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("未知图标名"))
    spy.mockRestore()
  })

  it("all category icons in data.json exist in iconMap", () => {
    for (const cat of siteData.categories) {
      expect(CATEGORY_ICONS).toHaveProperty(cat.icon)
    }
  })

  it("every data.json category icon resolves to a node", () => {
    for (const cat of siteData.categories) {
      expect(categoryIconNode(cat.icon)).not.toBeNull()
    }
  })
})
