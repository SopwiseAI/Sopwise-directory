"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";
import ThemeToggle from "./theme-toggle";
import { BrandMark } from "./brand-mark";

function MobileSearchInput({ defaultValue, onClose }: { defaultValue: string; onClose: () => void }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();

  const handleSearch = () => {
    const trimmed = value.trim();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
    if (e.key === "Escape") onClose();
  };

  return (
    <div className="flex items-center gap-1">
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" aria-hidden />
        <input
          autoFocus
          type="search"
          enterKeyHint="search"
          aria-label="搜索 AI 产品"
          autoComplete="off"
          placeholder="搜索 AI 产品…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-full rounded-md border border-border bg-card pl-8 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
        />
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="关闭搜索">
        <X className="size-4" />
      </Button>
    </div>
  );
}

function HeaderInner({ className }: { className?: string }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  return (
    <header className={cn("sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60", className)}>
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <BrandMark size="sm" />
          <span className="text-lg font-semibold tracking-tight">ailulu</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2">
          {searchOpen ? (
            <div className="w-full max-w-xs">
              <MobileSearchInput
                key={urlQuery}
                defaultValue={urlQuery}
                onClose={() => setSearchOpen(false)}
              />
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2 rounded-md pr-1.5 text-xs text-muted-foreground"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="size-3.5" />
              <span className="hidden sm:inline">搜索产品</span>
              <span className="sm:hidden">搜索</span>
              <span className="kbd" aria-hidden>/</span>
            </Button>
          )}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export default function Header({ className }: { className?: string }) {
  return (
    <Suspense>
      <HeaderInner className={className} />
    </Suspense>
  );
}