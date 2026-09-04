import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/format"

type PaginationProps = {
  page: number
  pageCount: number
  /** The route the list lives on, e.g. `ROUTES.store`. */
  basePath: string
  /**
   * The other query params in effect (search, filters) — carried onto every
   * page link so paging never drops a filter. `page` is set by this
   * component; anything falsy here is left out.
   */
  params?: Record<string, string | number | undefined>
  className?: string
}

/**
 * Prev / next paging for a server-rendered list.
 *
 * Used by the storefront catalogue. The admin console still ships its own
 * `AdminPagination` (same shape, its own copy); consolidating the two onto
 * this is a documented follow-up, not done here to keep the admin surface
 * untouched.
 *
 * `<Link>`s, so moving between pages is a client navigation and the shell does
 * not repaint. The app is RTL, so "next" points left and the chevrons are
 * flipped to match. Renders nothing on a single page.
 */
export function Pagination({
  page,
  pageCount,
  basePath,
  params = {},
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null

  const hrefFor = (target: number) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== "") query.set(key, String(value))
    }
    if (target > 1) query.set("page", String(target))
    const qs = query.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const linkClass = buttonVariants({ variant: "outline", size: "sm" })
  const disabledClass = cn(linkClass, "pointer-events-none opacity-50")

  return (
    <nav
      aria-label="تنقّل بين الصفحات"
      className={cn("flex items-center justify-between gap-2", className)}
    >
      <p className="text-xs text-muted-foreground">
        صفحة <span className="tabular-nums">{formatNumber(page)}</span> من{" "}
        <span className="tabular-nums">{formatNumber(pageCount)}</span>
      </p>

      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={hrefFor(page - 1)} rel="prev" className={linkClass}>
            <ChevronRightIcon aria-hidden="true" />
            السابق
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            <ChevronRightIcon aria-hidden="true" />
            السابق
          </span>
        )}

        {page < pageCount ? (
          <Link href={hrefFor(page + 1)} rel="next" className={linkClass}>
            التالي
            <ChevronLeftIcon aria-hidden="true" />
          </Link>
        ) : (
          <span aria-disabled="true" className={disabledClass}>
            التالي
            <ChevronLeftIcon aria-hidden="true" />
          </span>
        )}
      </div>
    </nav>
  )
}
