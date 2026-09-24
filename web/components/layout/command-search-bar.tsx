"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * 统一命令搜索条：
 * - 全站按 `/` 聚焦（非输入态时）
 * - 右侧 kbd 提示（⌘K 语义提示为 "/"）
 * - Enter 跳转 /search?q=...
 */
function CommandSearchInput({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isTypingTarget = (el: EventTarget | null) => {
    if (!(el instanceof HTMLElement)) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      e.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleSearch = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="group relative w-full">
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60 transition-colors group-focus-within:text-muted-foreground"
        aria-hidden
      />
      <input
        ref={inputRef}
        type="search"
        enterKeyHint="search"
        aria-label="搜索 AI 产品"
        autoComplete="off"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
          if (e.key === "Escape") inputRef.current?.blur();
        }}
        placeholder="搜索 AI 产品…"
        className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-14 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" aria-hidden>
        <span className="kbd">/</span>
      </span>
    </div>
  );
}

function CommandSearchBarInner({ className }: { className?: string }) {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  return (
    <div className={cn("sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70", className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-2.5 sm:px-6">
        <CommandSearchInput key={urlQuery} defaultValue={urlQuery} />
      </div>
    </div>
  );
}

export function CommandSearchBar({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={
        <div className={cn("sticky top-0 z-40 border-b bg-background/85 backdrop-blur", className)}>
          <div className="mx-auto w-full max-w-6xl px-4 py-2.5 sm:px-6">
            <div className="h-9 rounded-md border border-border bg-card" />
          </div>
        </div>
      }
    >
      <CommandSearchBarInner className={className} />
    </Suspense>
  );
}