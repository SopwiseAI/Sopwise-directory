import { describe, it, expect } from "vitest"
import { formatCount, formatDate } from "./format"

describe("formatCount", () => {
  it("returns string as-is for non-finite", () => {
    expect(formatCount(NaN)).toBe("NaN")
    expect(formatCount(Infinity)).toBe("Infinity")
  })

  it("returns plain number below 1000", () => {
    expect(formatCount(0)).toBe("0")
    expect(formatCount(42)).toBe("42")
    expect(formatCount(999)).toBe("999")
  })

  it("formats thousands with k suffix", () => {
    expect(formatCount(1000)).toBe("1k")
    expect(formatCount(1234)).toBe("1.2k")
    expect(formatCount(9999)).toBe("10k")
  })

  it("formats millions with m suffix", () => {
    expect(formatCount(1_000_000)).toBe("1m")
    expect(formatCount(1_234_567)).toBe("1.2m")
  })
})

describe("formatDate", () => {
  it("formats valid ISO date to zh-CN", () => {
    const result = formatDate("2024-01-15")
    expect(result).toContain("2024")
    expect(result).toContain("1")
    expect(result).toContain("15")
  })

  it("returns original string for invalid date", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date")
  })
})
