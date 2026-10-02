/**
 * localStorage key 前缀（env 可覆盖）。
 * 变更前缀会导致老用户本地历史/偏好「丢失」，故集中在此，避免各处硬编码漂移。
 */
export const STORAGE_PREFIX = process.env.NEXT_PUBLIC_STORAGE_PREFIX || "xigee"

/** 组合带前缀的存储 key：storageKey("history") → "xigee:history"。 */
export function storageKey(name: string): string {
  return `${STORAGE_PREFIX}:${name}`
}
