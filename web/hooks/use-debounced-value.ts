"use client"

import { useEffect, useState } from "react"

/**
 * 防抖值：`value` 稳定 `delay` 毫秒后才更新返回值。
 *
 * 「边打边搜」用它把「按键 → 写 URL → 重算结果」合并成一次，既避免每个字符都派发
 * 一次 Router restore，也让连续输入时的重排发生在停顿处、输入本身不掉帧。
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    if (Object.is(debounced, value)) return
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay, debounced])

  return debounced
}
