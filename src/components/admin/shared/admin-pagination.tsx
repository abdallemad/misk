import Link from "next/link"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { formatNumber } from "@/utils/format"

type AdminPaginationProps = {
  page: number
  pageCount: number
  /** The route the list lives on, e.g. `ROUTES.adminProducts`. */
  basePath: string
  /**
   * The other query params in effect (search, filters) — carried onto every
   * page link so paging never drops a filter. `page` is set by this
   * component; anything falsy here is left out.
   */
  params?: Record<string, string | undefined>
}

/**
 * Prev / next paging for an admin list page.
 *
 * Server-rendered `<Link>`s rather than the `ui/pagination` primitives' bare
 * `<a>` tags, so moving between pages is a client navigation and the sidebar
 * does not repaint. The console is RTL, so "next" points left and the
 * chevrons are flipped to match.
 *
 * Renders nothing when there is only one page — a pager on a single page is
 * noise.
 */
export function AdminPagination({
  page,
  pageCount,
  basePath,
  params = {},
}: AdminPaginationProps) {
  if (pageCount <= 1) return null

  const hrefFor = (target: number) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value)
    }
    if (target > 1) query.set("page", String(target))
    const qs = query.toString()
    return qs ? `${basePath}?${qs}` : basePath
  }

  const hasPrev = page > 1
  const hasNext = page < pageCount

  return (
    <nav
      aria-label="تنقّل بين الصفحات"
      className="flex items-center justify-between gap-2 px-4 py-3"
    >
      <p className="text-xs text-muted-foreground">
        صفحة <span className="tabular-nums">{formatNumber(page)}</span> من{" "}
        <span className="tabular-nums">{formatNumber(pageCount)}</span>
      </p>

      <div className="flex items-center gap-1">
        {hasPrev ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={hrefFor(page - 1)} />}
          >
            <ChevronRightIcon aria-hidden="true" />
            السابق
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronRightIcon aria-hidden="true" />
            السابق
          </Button>
        )}

        {hasNext ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={hrefFor(page + 1)} />}
          >
            التالي
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            التالي
            <ChevronLeftIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </nav>
  )
}
