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

/** A gap in the page list, rendered as «…». */
const GAP = "gap" as const

/**
 * Which page numbers to print: always the first and the last, the current
 * page with one neighbour on each side, and a «…» for every run that is left
 * out. A gap of exactly one page prints that page instead — «1 … 3» would
 * hide a single number behind a symbol the same width as it.
 *
 *   pageWindow(1, 3)  → 1 2 3
 *   pageWindow(5, 10) → 1 … 4 5 6 … 10
 *   pageWindow(3, 10) → 1 2 3 4 … 10
 */
function pageWindow(page: number, pageCount: number): (number | typeof GAP)[] {
  const shown = new Set([1, pageCount, page - 1, page, page + 1])
  const items: (number | typeof GAP)[] = []

  for (let n = 1; n <= pageCount; n++) {
    if (shown.has(n)) {
      items.push(n)
    } else if (shown.has(n - 1) && shown.has(n + 1)) {
      items.push(n)
    } else if (items.at(-1) !== GAP) {
      items.push(GAP)
    }
  }

  return items
}

/**
 * Numbered paging for a server-rendered list:
 * «السابق · 1 2 … 9 · التالي», the current page filled in.
 *
 * Used by the storefront catalogue. The admin console still ships its own
 * `AdminPagination` (prev / next only, its own copy); consolidating the two
 * onto this is a documented follow-up, not done here to keep the admin
 * surface untouched.
 *
 * `<Link>`s, so moving between pages is a client navigation and the shell does
 * not repaint — which is also why this is not built on the `ui/pagination`
 * primitives, whose links are bare `<a>`s. The app is RTL, so "next" points
 * left and the chevrons are flipped to match. On a phone the prev / next
 * labels collapse to their chevrons and the numbers drop from 36px to 32px,
 * so the widest row («1 … 4 5 6 … 10») still fits a 375px screen. Renders nothing on
 * a single page.
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

  // Through `cn` so tailwind-merge drops the base `border-transparent` in
  // favour of the outline variant's `border-border`; raw `buttonVariants`
  // output keeps both, and the transparent one wins on source order.
  const stepClass = cn(buttonVariants({ variant: "outline", size: "lg" }))
  const disabledStepClass = cn(stepClass, "pointer-events-none opacity-50")

  const previousLabel = (
    <>
      <ChevronRightIcon aria-hidden="true" />
      <span className="hidden sm:inline">السابق</span>
    </>
  )
  const nextLabel = (
    <>
      <span className="hidden sm:inline">التالي</span>
      <ChevronLeftIcon aria-hidden="true" />
    </>
  )

  return (
    <nav aria-label="تنقّل بين الصفحات" className={cn("flex justify-center", className)}>
      <ul className="flex items-center gap-1">
        <li>
          {page > 1 ? (
            <Link
              href={hrefFor(page - 1)}
              rel="prev"
              aria-label="الصفحة السابقة"
              className={stepClass}
            >
              {previousLabel}
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledStepClass}>
              {previousLabel}
            </span>
          )}
        </li>

        {pageWindow(page, pageCount).map((item, index) =>
          item === GAP ? (
            <li
              key={`gap-${index}`}
              aria-hidden="true"
              className="flex size-8 items-center justify-center text-muted-foreground sm:size-9"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={hrefFor(item)}
                aria-label={`صفحة ${formatNumber(item)} من ${formatNumber(pageCount)}`}
                aria-current={item === page ? "page" : undefined}
                className={cn(
                  buttonVariants({
                    variant: item === page ? "default" : "ghost",
                    size: "icon",
                  }),
                  "tabular-nums sm:size-9",
                  item === page && "pointer-events-none"
                )}
              >
                {formatNumber(item)}
              </Link>
            </li>
          )
        )}

        <li>
          {page < pageCount ? (
            <Link
              href={hrefFor(page + 1)}
              rel="next"
              aria-label="الصفحة التالية"
              className={stepClass}
            >
              {nextLabel}
            </Link>
          ) : (
            <span aria-disabled="true" className={disabledStepClass}>
              {nextLabel}
            </span>
          )}
        </li>
      </ul>
    </nav>
  )
}
