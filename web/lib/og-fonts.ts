import { readFileSync } from "node:fs"
import { join } from "node:path"

/**
 * OG 分享图专用字体。
 *
 * satori（next/og）既不识别 @fontsource 的 woff2，也不会合成伪粗体，
 * 因此显式注册 Outfit 的 400/600/700 静态 TTF，保证品牌字体与字重真实生效。
 * 中文（Outfit 不含 CJK 字形）由 next/og 内置的 Google Fonts 动态加载器按需补齐。
 */
const OUTFIT_WEIGHTS = [400, 600, 700] as const

export const OG_FONTS = OUTFIT_WEIGHTS.map((weight) => ({
  name: "Outfit",
  data: readFileSync(join(process.cwd(), "assets", "fonts", `outfit-${weight}.ttf`)),
  weight,
  style: "normal" as const
}))
