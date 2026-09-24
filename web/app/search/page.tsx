import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/search/search-results";

export const metadata: Metadata = {
  title: "搜索",
  robots: { index: false, follow: true },
};

export default function SearchPage() {
  return (
    <>
      {/* h1：页面语义主题（PG-04） */}
      <h1 className="sr-only">搜索 AI 产品</h1>
      <Suspense fallback={<p className="text-center text-muted-foreground py-12">加载中…</p>}>
        <SearchResults />
      </Suspense>
    </>
  );
}
