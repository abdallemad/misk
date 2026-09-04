import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { BrandLockup } from "@/components/shared/brand-lockup"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"

/**
 * The storefront chrome around `/store` — a header and a footer, factored out
 * of the page so the layout owns them and the page owns only the catalogue.
 *
 * Deliberately lighter than the landing page's `SiteHeader`: no category nav
 * up here, because `/store` renders its own category chips in the page body
 * where they double as the filter. Both are Server Components — nothing here
 * needs the client.
 */

export function StoreHeader() {
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
            aria-label="السلة"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ShoppingBagIcon />
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
