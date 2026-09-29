import { describe, it, expect, afterEach, vi } from "vitest"
import { cn, getBaseUrl } from "./utils"

describe("cn", () => {
  it("merges plain class names", () => {
    expect(cn("a", "b")).toBe("a b")
  })

  it("skips falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c")
  })

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4")
    expect(cn("text-sm", "text-lg")).toBe("text-lg")
  })

  it("handles arrays and objects via clsx", () => {
    expect(cn(["a", { b: true, c: false }])).toBe("a b")
  })
})

describe("getBaseUrl", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("returns env value when set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://test.example.com")
    expect(getBaseUrl()).toBe("https://test.example.com")
  })

  it("falls back to default when env is empty", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "")
    expect(getBaseUrl()).toBe("https://www.xigee.net")
  })

  it("falls back to default when env is undefined", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", undefined as unknown as string)
    expect(getBaseUrl()).toBe("https://www.xigee.net")
  })
})
