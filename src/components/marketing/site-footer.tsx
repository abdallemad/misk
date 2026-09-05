import Link from "next/link"

import { BrandLockup } from "@/components/shared/brand-lockup"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CATEGORY_ACCENT, type CategorySlug } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"

const CATEGORIES: CategorySlug[] = ["youth", "women", "men"]

/** The built catalogue lives at `/store`; `/store?category=<slug>` filters it. */
const storeCategoryHref = (slug: CategorySlug) =>
  `${ROUTES.store}?category=${slug}`

/**
 * The marketing footer — shared by `/`, `/about` and `/contact`, the first
 * component under `components/marketing/` (previously predicted, never
 * needed, until a second page wanted the same footer — see
 * docs/landing-page.md's "Extending this").
 *
 * Deliberately **not** `StoreFooter` (`components/store`) — that one is a
 * bare brand mark + copyright line, correct for `/store`/`/cart`/`/checkout`/
 * `/account/*` where a shopper mid-task already has the header. A marketing
 * page is often the *first* page someone lands on, so its footer is where
 * the category links, «حكايتنا» and «تواصل معنا» live for anyone who
 * scrolled instead of using the header.
 *
 * `CATEGORIES` stays hard-coded, the same call `CategoryStrip` on `/` makes
 * and for the identical reason — Youth / Women / Men are the shop's founding
 * segments (docs/categories-feature.md), not rows to fetch.
 */
export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-page px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <BrandLockup tagline="دار عطور" />
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          {CATEGORIES.map((slug) => (
            <Link
              key={slug}
              href={storeCategoryHref(slug)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {CATEGORY_ACCENT[slug].label}
            </Link>
          ))}
          <Link
            href={ROUTES.about}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            حكايتنا
          </Link>
          <Link
            href={ROUTES.contact}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            تواصل معنا
          </Link>
          <Link
            href="/design-system"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            نظام التصميم
          </Link>
        </nav>
      </div>

      <Separator className="my-8" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground">
          © <span data-numeric>{new Date().getFullYear()}</span> مِسك. كل الحقوق
          محفوظة.
        </p>
        <Badge variant="neutral">يُمزَج عند الطلب</Badge>
      </div>
    </footer>
  )
}
