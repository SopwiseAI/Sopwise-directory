import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "页面未找到",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-mono text-6xl font-bold tabular-nums text-muted-foreground/40">404</p>
      <p className="text-sm text-muted-foreground">页面不存在</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        返回首页
      </Link>
    </div>
  );
}