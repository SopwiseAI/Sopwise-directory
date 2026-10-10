import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div role="status" className="flex flex-col gap-4" aria-busy="true">
      <span className="sr-only">正在加载…</span>
      <Skeleton className="h-8 w-48 rounded-md" />
      <div className="product-card-grid">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2.5 rounded-lg border bg-card p-4">
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-2/3 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-4/5 rounded" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
