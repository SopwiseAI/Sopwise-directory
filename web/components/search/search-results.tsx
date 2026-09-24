"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { SearchX } from "lucide-react";
import { getAllProducts, getFeaturedProducts } from "@/lib/data";
import { createSearchIndex } from "@/lib/search";
import { ProductRow } from "@/components/product/product-row"
import { formatCount } from "@/lib/format";

const allProducts = getAllProducts();
const searchIndex = createSearchIndex(allProducts);
const featured = getFeaturedProducts();
const suggestions = featured.slice(0, 5).map((p) => p.name);

export function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get("q") || "";

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex.search(query).map((r) => r.item);
  }, [query]);

  if (!query.trim()) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-xl border bg-card">
          <SearchX className="size-7 text-muted-foreground/60" />
        </div>
        <p className="text-sm text-muted-foreground">
          输入关键词开始搜索，或使用顶栏命令搜索框（按{" "}
          <span className="kbd" aria-hidden>/</span> 聚焦）
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl border bg-card">
            <SearchX className="size-6 text-muted-foreground/60" />
          </div>
          <p className="text-sm text-muted-foreground">
            未找到与 <span className="font-medium text-foreground">「{query}」</span> 相关的产品
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
            <span className="text-xs text-muted-foreground">试试搜索：</span>
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => router.push(`/search?q=${encodeURIComponent(s)}`)}
                className="rounded-md px-2 py-0.5 text-xs text-primary hover:bg-primary/10 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {featured.length > 0 && (
          <div className="space-y-2">
            <h2 className="flex items-baseline gap-2 text-base font-semibold tracking-tight">
              精选推荐
              <span className="font-data font-normal text-muted-foreground">FEATURED</span>
            </h2>
            <div className="rounded-lg border bg-card">
              {featured.map((product, i) => (
                <ProductRow key={product.id} product={product} last={i === featured.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        找到{" "}
        <span className="font-mono font-medium tabular-nums text-foreground">{formatCount(results.length)}</span>{" "}
        个与 <span className="font-medium text-foreground">「{query}」</span> 相关的结果
      </p>
      <div className="rounded-lg border bg-card">
        {results.map((product, i) => (
          <ProductRow key={product.id} product={product} last={i === results.length - 1} />
        ))}
      </div>
    </div>
  );
}