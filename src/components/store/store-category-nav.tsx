import Link from "next/link"

import { categoryAccent } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/format"
import type { StoreCategory } from "@/services/catalog.service"

type StoreCategoryNavProps = {
  categories: StoreCategory[]
  /** The slug currently filtered on, or `undefined` for "الكل". */
  activeSlug?: string
  /**
   * The other query params in effect (`q`, `type`, `sort`) — carried onto
   * every chip so switching category keeps the search and the sort. `page` is
   * deliberately dropped: a new category has a different number of pages.
   */
  params: Record<string, string | undefined>
}

/**
 * The category filter, rendered as chips.
 *
 * A Server Component: each chip is a plain `<Link>` that sets `?category=`,
 * and the active one is known from `activeSlug` (a prop off `searchParams`),
 * so there is no client state and no `useSearchParams`. This is the "render
 * the products by category" half of the page — the chips *are* the by-category
 * view.
 */
export function StoreCategoryNav({
  categories,
  activeSlug,
  params,
}: StoreCategoryNavProps) {
  const hrefFor = (slug?: string) => {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (value) query.set(key, value)
    }
    if (slug) query.set("category", slug)
    const qs = query.toString()
    return qs ? `${ROUTES.store}?${qs}` : ROUTES.store
  }

  const chip =
    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
  const on = "border-gold bg-gold-soft text-gold-soft-foreground"
  const off = "border-border text-muted-foreground hover:bg-muted hover:text-foreground"

  return (
    <nav aria-label="التصفية حسب الفئة" className="flex flex-wrap gap-2">
      <Link
        href={hrefFor(undefined)}
        aria-current={activeSlug ? undefined : "page"}
        className={cn(chip, activeSlug ? off : on)}
      >
        الكل
      </Link>

      {categories.map((category) => {
        const active = category.slug === activeSlug
        return (
          <Link
            key={category.id}
            href={hrefFor(category.slug)}
            aria-current={active ? "page" : undefined}
            className={cn(chip, active ? on : off)}
          >
            <span
              aria-hidden="true"
              className={cn("size-1.5 rounded-full", categoryAccent(category.slug).bg)}
            />
            {category.name}
            <span className="text-xs tabular-nums opacity-70">
              {formatNumber(category.productCount)}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
