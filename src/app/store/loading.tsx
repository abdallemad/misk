import { Skeleton } from "@/components/ui/skeleton"

/** Covers the catalogue query on navigation into and within `/store`. */
export default function StoreLoading() {
  return (
    <div className="mx-auto max-w-page px-4 pb-16 sm:px-6">
      <div className="-mx-4 mb-8 border-b border-border px-4 py-12 sm:-mx-6 sm:px-6 sm:py-16">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-4 h-9 w-56" />
        <Skeleton className="mt-4 h-4 w-80 max-w-full" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl ring-1 ring-foreground/10">
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
