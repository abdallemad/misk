import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { BrandLockup } from "@/components/shared/brand-lockup"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { getCartCount } from "@/services/cart.service"

/**
 * The storefront chrome around `/store` and `/cart` — a header and a footer,
 * factored out so each layout owns them and the page owns only its content.
 *
 * Deliberately lighter than the landing page's `SiteHeader`: no category nav
 * up here, because `/store` renders its own category chips in the page body
 * where they double as the filter. Both are Server Components — nothing here
 * needs the client, including the cart badge below.
 */

/** `StoreHeader` is `async` only for this — see `getCartCount`'s own doc for
 *  why it is a cheap, occasionally-optimistic cookie sum rather than a query. */
export async function StoreHeader() {
  const count = await getCartCount()

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:px-6">
        <BrandLockup size="sm" />

        <nav className="hidden items-center gap-1 sm:flex">
          <Link
            href={ROUTES.home}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            الرئيسية
          </Link>
          <Link
            href={ROUTES.store}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            المتجر
          </Link>
        </nav>

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
