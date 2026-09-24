/**
 * 产品图标服务。使用 Cloudflare 托管的 icon.horse（全球可达、含中国大陆），
 * 从产品 URL 域名提取品牌 favicon；失败时由组件回退为首字母。
 */

export const FAVICON_BASE_URL = "https://icon.horse/icon"

export function getFaviconUrl(url: string): string {
  try {
    const { hostname } = new URL(url)
    if (!hostname) return ""
    return `${FAVICON_BASE_URL}/${hostname}`
  } catch {
    return ""
  }
}

/** 提取域名展示文本（如 https://chat.openai.com → chat.openai.com） */
export function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}
