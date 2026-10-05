"use client"

import { useSyncExternalStore } from "react"

const noopSubscribe = () => () => {}
const mountedSnapshot = () => true
const notMountedSnapshot = () => false

/**
 * 返回组件是否已完成挂载（hydration 后）。SSG 站点用它门控所有「仅客户端可得」的
 * 状态（localStorage / window），避免服务端与首帧客户端渲染不一致导致 hydration mismatch。
 *
 * 服务端快照恒为 false，首个客户端快照在 hydration 完成后翻转为 true。
 */
export function useMounted(): boolean {
  return useSyncExternalStore(noopSubscribe, mountedSnapshot, notMountedSnapshot)
}
