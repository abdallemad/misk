import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { BrandLockup } from "@/components/shared/brand-lockup"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { StoreNavMenu } from "@/components/store/store-nav"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { getCartCount } from "@/services/cart.service"
import { listCatalogCategories } from "@/services/catalog.service"

/**
 * The storefront chrome around `/store`, `/cart`, `/checkout` and
 * `/account/*` — a header and a footer, factored out so each layout owns them
 * and the page owns only its content.
 *
 * The header's nav is `StoreNavMenu` — «المتجر» and «حسابي» are hover
 * dropdowns (`components/ui/navigation-menu.tsx`) rather than flat links, so
 * a shopper reaches a category or «طلباتي» without leaving the header. See
 * docs/store-feature.md.
 */

/** `StoreHeader` is `async` for two cheap reads: `getCartCount` (a cookie
 *  sum, not a query — see its own doc) and `listCatalogCategories` (the same
 *  active-categories list `/store`'s own chips already fetch), handed down to
 *  the client-side `StoreNavMenu` for the «المتجر» dropdown's contents. */
export async function StoreHeader() {
  const [count, categories] = await Promise.all([
    getCartCount(),
    listCatalogCategories(),
  ])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLockup size="sm" />

        <div className="hidden sm:flex">
          <StoreNavMenu categories={categories} />
        </div>

        <div className="flex items-center gap-1">
          <AuthNav />
          <ThemeToggle />
          <Link
            href={ROUTES.cart}
            aria-label={count > 0 ? `السلة — ${count} قطعة` : "السلة"}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon" }),
              "relative"
            )}
          >
            <ShoppingBagIcon />
            {count > 0 ? (
              <span
                data-numeric
                className="absolute -top-1 -end-1 flex size-4 min-w-4 items-center justify-center rounded-full bg-gold px-0.5 text-[0.625rem] leading-none font-medium tabular-nums text-gold-foreground"
              >
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  )
}

export function StoreFooter() {
  return (
    <footer className="mx-auto w-full max-w-page px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <BrandLockup tagline="دار عطور" />
        <p className="text-xs text-muted-foreground">
          © <span data-numeric>{new Date().getFullYear()}</span> مِسك. كل الحقوق
          محفوظة.
        </p>
      </div>
    </footer>
  )
}
