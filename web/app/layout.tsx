import type { Metadata, Viewport } from "next"
import { GeistMono } from "geist/font/mono"
import "@fontsource-variable/outfit"
import { getAllCategories, getCategoryCounts, getStats } from "@/lib/data"
import { getBaseUrl } from "@/lib/utils"
import Header from "@/components/layout/header"
import { SubNav } from "@/components/layout/sub-nav"
import { CategorySidebar } from "@/components/category/category-sidebar"
import { MainHeader } from "@/components/layout/main-header"
import { HistoryTracker } from "@/components/runtime/history-tracker"
import { WebVitals } from "@/components/runtime/web-vitals"
import { TooltipProvider } from "@/components/ui/tooltip"
import Footer from "@/components/layout/footer"
import "./globals.css"

const allCategories = getAllCategories()
const categoryCounts = getCategoryCounts()
const totalProducts = getStats().products

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "XiGee",
  alternateName: "XiGee — AI 发现引擎",
  url: getBaseUrl(),
  potentialAction: {
    "@type": "SearchAction",
    target: `${getBaseUrl()}/search?q={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
}

/** JSON-LD 注入前转义 `<`，避免内容中的 </script> 提前闭合脚本标签。 */
const jsonLdString = JSON.stringify(jsonLd).replace(/</g, "\\u003c")

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
}

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: { default: "XiGee — 你的 AI 发现引擎", template: "%s — XiGee" },
  description: "XiGee 是你的 AI 发现引擎，精选各类 AI 工具与应用，按分类浏览或直接搜索你需要的能力",
  keywords: ["AI", "AI产品", "AI工具", "人工智能", "AI导航", "AI发现引擎", "XiGee"],
  openGraph: {
    title: "XiGee — 你的 AI 发现引擎",
    description: "精选各类 AI 工具与应用，XiGee 为你发现最好的 AI 产品",
    siteName: "XiGee",
    locale: "zh_CN",
    type: "website"
  }
}

/**
 * 首帧偏好引导脚本（必须内联在 <head> 且同步执行，早于首次绘制）。
 *
 * 曾经用 next/script beforeInteractive，但它会被塞进 `self.__next_s` 队列、
 * 等 Next 运行时 chunk 加载后才执行 —— 首绘已发生，于是出现「先默认、后跳变」闪烁。
 * 改为 <head> 内联 <script> 后，浏览器解析到即执行，先于 body 解析与首绘。
 *
 * 只做「读偏好 → 写 <html> 属性」，具体渲染交给 CSS（首帧）与 React（hydration 后接管）。
 */
const prefsScript = `(function(){try{
var d=document.documentElement;
var t=localStorage.getItem("theme")||"system";
var m=window.matchMedia("(prefers-color-scheme:dark)");
var dark=t==="dark"||(t==="system"&&m.matches);
d.classList.toggle("dark",dark);
d.setAttribute("data-theme",t==="light"||t==="dark"||t==="system"?t:"system");
var meta=document.querySelector('meta[name="theme-color"]');
if(meta)meta.setAttribute("content",dark?"#151517":"#ffffff");
var sb=localStorage.getItem("xigee:sidebar-collapsed")==="true";
d.setAttribute("data-sidebar",sb?"collapsed":"expanded");
try{var h=JSON.parse(localStorage.getItem("xigee:history")||"[]");var arr=Array.isArray(h)?h:(h&&Array.isArray(h.items)?h.items:[]);if(arr.length)d.setAttribute("data-history","has")}catch(e){}
var p=new URLSearchParams(location.search);
var view=p.get("view")||localStorage.getItem("xigee:default-view")||"";
var sort=p.get("sort")||localStorage.getItem("xigee:default-sort")||"";
var tab=p.get("tab")||"";
if(view)d.setAttribute("data-view",view);
if(sort)d.setAttribute("data-sort",sort);
if(tab)d.setAttribute("data-tab",tab);
var pending=(view&&view!=="grid")||(sort&&sort!=="latest")||(tab&&tab!=="all");
if(pending){
d.setAttribute("data-prefs","pending");
setTimeout(function(){d.removeAttribute("data-prefs")},2000)
}
}catch(e){}})()`

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${GeistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
        {/* 必须最先执行：同步内联脚本，早于首绘应用主题 / 侧栏 / 产品偏好的首帧状态 */}
        <script dangerouslySetInnerHTML={{ __html: prefsScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString }} />
      </head>
      <body className="min-h-full flex flex-col md:h-[100dvh] md:overflow-hidden">
        <HistoryTracker />
        <WebVitals />
        <TooltipProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
          >
            跳到主要内容
          </a>
          {/* 首帧偏好由 <head> 内联 prefsScript 在首绘前写入 <html>，此处不再使用 next/script */}
          <Header className="md:hidden" />
          <SubNav className="md:hidden" categories={allCategories} categoryCounts={categoryCounts} />
          {/* DSH 双表面骨架：左栏灰（sidebar）/ 右区白（main） */}
          <div className="flex flex-1 md:overflow-hidden">
            <CategorySidebar categories={allCategories} categoryCounts={categoryCounts} totalProducts={totalProducts} />
            <div className="flex min-w-0 flex-1 flex-col bg-background md:overflow-hidden">
              <MainHeader className="hidden md:flex" categories={allCategories} />
              <div className="flex flex-1 flex-col md:min-h-0 md:overflow-y-auto">
                <main id="main" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-6 sm:px-6 flex-1">
                  {children}
                </main>
                <Footer />
              </div>
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
}
