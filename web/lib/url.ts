export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** 构造搜索页 href：查询词去空白后写入 q（空则不带 q）。 */
export function searchPageHref(query: string): string {
  const q = query.trim()
  return q ? `/search?q=${encodeURIComponent(q)}` : "/search"
}

/**
 * 把查询词**原地写回**当前地址栏：不触发导航、不产生网络请求。
 *
 * Next 16 给 `window.history.replaceState` 打了补丁 —— 调用后只派发 `ACTION_RESTORE`
 * 同步 Router 的 canonicalUrl，`useSearchParams()` 随之更新，但**不会发起 RSC 请求**
 * （实现见 `next/dist/client/components/app-router.js`，官方文档「Native History API」一节）。
 *
 * 这是搜索「边打边搜」的关键：实测服务端对任意 `?q=` 返回的都是同一份空骨架
 * （RSC 载荷里既没有「找到 N 个」也没有「未找到与」），搜索结果 100% 在浏览器里算，
 * 走 `router.push` 等于每次换词白跑一趟服务器。换成 replaceState 后这次往返直接消失。
 *
 * 返回写入后的 href；与当前地址一致时跳过写入，避免每次按键都派发一次 restore。
 */
export function writeSearchQuery(query: string, pathname: string, search: string): string {
  const q = query.trim()
  const rest = new URLSearchParams(search)
  rest.delete("q")
  const restStr = rest.toString()
  const qs = [q ? `q=${encodeURIComponent(q)}` : "", restStr].filter(Boolean).join("&")
  const next = qs ? `${pathname}?${qs}` : pathname

  if (typeof window !== "undefined" && `${pathname}${search}` !== next) {
    window.history.replaceState(null, "", next)
  }
  return next
}
