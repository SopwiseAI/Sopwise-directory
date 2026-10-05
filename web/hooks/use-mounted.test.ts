import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useMounted } from "./use-mounted"

describe("useMounted", () => {
  it("挂载后返回 true", () => {
    const { result } = renderHook(() => useMounted())
    expect(result.current).toBe(true)
  })
})
