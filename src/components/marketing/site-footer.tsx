import Link from "next/link"

import { BrandLockup } from "@/components/shared/brand-lockup"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BRAND_ABOUT } from "@/constants/about"
import { LEGAL_LINKS } from "@/constants/legal"
import { ROUTES } from "@/constants/routes"
import { listCatalogCategories } from "@/services/catalog.service"

/** The built catalogue lives at `/store`; `/store?category=<slug>` filters it. */
const storeCategoryHref = (slug: string) =>
  `${ROUTES.store}?category=${encodeURIComponent(slug)}`

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
 * The category links are **read from the database** — the same
 * `listCatalogCategories()` the header's «المتجر» dropdown uses (active, with
 * at least one sellable perfume, in `position` order) — so a category added
 * or retired in `/admin/categories` shows up or disappears here with no code
 * edit. They used to be a hard-coded Youth / Women / Men list; see
 * docs/landing-page.md, "Categories are data now".
 *
 * Under the brand mark sits the founder's «عن مِسك» paragraph —
 * `BRAND_ABOUT.full`, the same sentences `/about` is built from, so the two
 * cannot say different things. The bottom row carries the three legal pages
 * (`LEGAL_LINKS` — `/terms`, `/privacy`, `/refunds`; docs/legal-pages.md).
 */
export async function SiteFooter() {
  const categories = await listCatalogCategories()

  return (
    <footer className="mx-auto w-full max-w-page px-6 py-14">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-md">
          <BrandLockup tagline="دار عطور" />
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            {BRAND_ABOUT.full}
          </p>
        </div>
        <nav
          aria-label="روابط الموقع"
          className="flex flex-wrap gap-x-8 gap-y-3 text-sm"
        >
          {categories.map((category) => (
            <Link
              key={category.id}
              href={storeCategoryHref(category.slug)}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {category.name}
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
        <nav
          aria-label="السياسات"
          className="flex flex-wrap gap-x-6 gap-y-2 text-xs"
        >
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Badge variant="neutral">يُمزَج عند الطلب</Badge>
      </div>
    </footer>
  )
}
