import { describe, it, expect } from "vitest"
import { getDomain } from "./url"

describe("getDomain", () => {
  it("extracts hostname from URL", () => {
    expect(getDomain("https://www.example.com")).toBe("example.com")
    expect(getDomain("https://example.com/path/to/page")).toBe("example.com")
  })

  it("strips www prefix", () => {
    expect(getDomain("https://www.google.com")).toBe("google.com")
    expect(getDomain("http://www.github.com/org/repo")).toBe("github.com")
  })

  it("returns empty string for invalid URL", () => {
    expect(getDomain("not-a-url")).toBe("")
    expect(getDomain("")).toBe("")
  })
})
