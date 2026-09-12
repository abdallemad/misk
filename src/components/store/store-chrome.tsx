import Link from "next/link"
import { LayoutDashboardIcon, ShoppingBagIcon } from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { BrandLockup } from "@/components/shared/brand-lockup"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { MobileNav } from "@/components/store/mobile-nav"
import { StoreNavMenu } from "@/components/store/store-nav"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { isAdmin } from "@/services/auth.service"
import { getCartCount } from "@/services/cart.service"
import { listCatalogCategories } from "@/services/catalog.service"

/**
 * The storefront chrome around `/store`, `/cart`, `/checkout` and
 * `/account/*` — a header and a footer, factored out so each layout owns them
 * and the page owns only its content.
 *
 * The header's nav is `StoreNavMenu` on `sm` and up — «المتجر»، «عن مِسك»
 * and «حسابي» are hover dropdowns (`components/ui/navigation-menu.tsx`)
 * rather than flat links, so a shopper reaches a category or «طلباتي»
 * without leaving the header. Below `sm` it is `MobileNav` instead — a
 * slide-out `Sheet` with the same destinations as a flat list, because
 * nothing on a touch screen can hover. See docs/store-feature.md.
 *
 * **Mobile row order is `order-first` on the trigger, not DOM order.**
 * `MobileNav`'s wrapper sat between `BrandLockup` and the icon cluster,
 * so with `justify-between` splitting three groups evenly it landed in the
 * *middle* of the header with visible gaps on both sides — nowhere near an
 * edge. `order-first sm:order-none` makes it the first item in visual order
 * without moving it in the DOM (so desktop, where it's hidden anyway, is
 * untouched); `justify-between` then pins that first-ordered item flush to
 * the row's start edge — the physical **right** in this RTL app, matching
 * where `BrandLockup` already sits flush with no extra margin of its own.
 *
 * **`AuthNav` / `ThemeToggle` are `hidden sm:flex` here** — moved into
 * `MobileNav`'s own drawer content below `sm` instead, so the mobile header
 * row stays to exactly two controls (the menu trigger, the cart icon) and
 * doesn't get crowded fitting a sign-in button and a theme toggle into the
 * same 375px row `StoreNavMenu`'s dropdowns already had to be hidden from.
 *
 * **«لوحة التحكم» follows the identical split.** `isAdmin()` is checked here,
 * server-side — the same "next request" freshness `admin-access-control.md`
 * already documents for a role change, not the client-reactive `<Show>`
 * `StoreNavMenu`'s «حسابي» dropdown uses for sign-in/out, which can happen
 * mid-session through the auth modal without a page navigation. A role
 * change cannot happen to a shopper acting on themselves, so a value fixed
 * at render time is the right amount of freshness. Hidden with the same
 * `sm:flex` pair on desktop, and duplicated inside `MobileNav`'s drawer below
 * `sm`, for a non-admin visitor to never see the console link at all.
 */

/** `StoreHeader` is `async` for three cheap reads: `getCartCount` (a cookie
 *  sum, not a query — see its own doc), `listCatalogCategories` (the same
 *  active-categories list `/store`'s own chips already fetch), and
 *  `isAdmin()` (a Clerk read, no database query) — handed down to whichever
 *  of `StoreNavMenu` / `MobileNav` the viewport renders. */
export async function StoreHeader() {
  const [count, categories, admin] = await Promise.all([
    getCartCount(),
    listCatalogCategories(),
    isAdmin(),
  ])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <div className="order-first sm:order-none sm:hidden">
          <MobileNav categories={categories} isAdmin={admin} />
        </div>

        <BrandLockup size="sm" />

        <div className="hidden sm:flex">
          <StoreNavMenu categories={categories} />
        </div>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {admin ? (
              <Link href={ROUTES.admin} className={buttonVariants({ variant: "outline", size: "sm" })}>
                <LayoutDashboardIcon data-icon="inline-start" aria-hidden="true" />
                لوحة التحكم
              </Link>
            ) : null}
            <AuthNav />
            <ThemeToggle />
          </div>
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
