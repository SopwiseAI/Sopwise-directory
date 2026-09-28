/**
 * 紧凑数字格式化：大数值以 k/m 后缀展示，保持可读性。
 * 1000 → "1k"，1234 → "1.2k"，1234567 → "1.2m"
 */
export function formatCount(n: number): string {
  if (!Number.isFinite(n)) return String(n)
  if (n < 1000) return String(n)
  if (n < 1_000_000) {
    return formatSuffix(n / 1000, "k")
  }
  return formatSuffix(n / 1_000_000, "m")
}

function formatSuffix(value: number, suffix: string): string {
  // 保留 1 位小数并去除尾随 0："1.0k" → "1k"，"1.25k" → "1.2k"
  const rounded = Math.round(value * 10) / 10
  const str = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
  return str + suffix
}

export function formatDate(iso: string): string {
  if (!iso) return iso
  // 纯日期 "2024-01-15" 追加 UTC 午夜，避免本地时区偏移导致日期偏移
  const date = iso.length === 10 ? new Date(iso + "T00:00:00Z") : new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString("zh-CN", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" })
}
