import type { Metadata } from "next"
import Script from "next/script"
import { Geist, Geist_Mono } from "next/font/google"
import Header from "@/components/layout/header"
import { SubNav } from "@/components/layout/sub-nav"
import { CategorySidebar } from "@/components/category/category-sidebar"
import { CommandSearchBar } from "@/components/layout/command-search-bar"
import { HistoryTracker } from "@/components/layout/history-tracker"
import { TooltipProvider } from "@/components/ui/tooltip"
import Footer from "@/components/layout/footer"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"]
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"]
})

export const metadata: Metadata = {
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

/** 首屏前执行：主题 class + 浏览器主题色。避免闪烁，同步 dark 状态。 */
const themeScript = `(function(){try{const t=localStorage.getItem("theme")||"system";const m=window.matchMedia("(prefers-color-scheme:dark)");const dark=t==="dark"||(t==="system"&&m.matches);document.documentElement.classList.toggle("dark",dark);const meta=document.querySelector('meta[name="theme-color"]');if(meta){meta.setAttribute("content",dark?"#0f1114":"#fafafb")}}catch(e){}})()`

/** 首帧前读取侧栏折叠偏好写入 <html data-sidebar>，CSS 据此先行渲染折叠态（SB-01，避免展开→折叠闪烁）。 */
const sidebarScript = `(function(){try{const c=localStorage.getItem("xigee:sidebar-collapsed")==="true";document.documentElement.setAttribute("data-sidebar",c?"collapsed":"expanded")}catch(e){document.documentElement.setAttribute("data-sidebar","expanded")}})()`

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <meta name="theme-color" content="#fafafb" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="min-h-full flex flex-col md:h-[100dvh] md:overflow-hidden">
        <HistoryTracker />
        <TooltipProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:text-primary-foreground"
          >
            跳到主要内容
          </a>
          {/* beforeInteractive：注入 <head> 且由 Next 管理执行时机（hydration 之前），避免 FOUC */}
          <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
          <Script id="sidebar-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: sidebarScript }} />
          <Header className="md:hidden" />
          <SubNav className="md:hidden" />
          <div className="flex flex-1 md:overflow-hidden">
            <CategorySidebar />
            <div className="min-w-0 flex-1 md:overflow-y-auto flex flex-col">
              <CommandSearchBar className="hidden md:block" />
              <main id="main" className="mx-auto w-full max-w-7xl scroll-mt-16 px-4 py-6 sm:px-6 flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
}
