import { Skeleton } from "@/components/ui/skeleton"

/** Covers `getStoreProduct` on navigation into a product page. */
export default function StoreProductLoading() {
  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <Skeleton className="h-3 w-48" />
      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <Skeleton className="aspect-square w-full rounded-xl" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
