import { PageContainer } from "@/components/admin/shared"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * The fallback for admin pages while their data resolves.
 *
 * It mirrors the overview's shape — heading, a row of tiles, a panel —
 * rather than showing a spinner, so the page does not visibly reflow when
 * the real content lands.
 *
 * Note it does **not** cover the first render of `/admin` itself: the layout
 * above awaits `cookies()` and the admin check, and Next.js blocks on a
 * layout's runtime data before it streams a child's fallback. It does cover
 * every navigation *within* `/admin`, where the layout is already rendered
 * and only the page re-runs — which is the case that actually repeats.
 */
export default function AdminLoading() {
  return (
    <PageContainer>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px] rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-64 rounded-xl" />
    </PageContainer>
  )
}
