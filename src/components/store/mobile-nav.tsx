"use client"

import { useState } from "react"
import Link from "next/link"
import { Show } from "@clerk/nextjs"
import {
  BookOpenIcon,
  MenuIcon,
  MessageCircleIcon,
  ReceiptTextIcon,
  ShoppingBagIcon,
} from "lucide-react"

import { AuthNav } from "@/components/shared/auth-nav"
import { ThemeToggle } from "@/components/shared/theme-toggle"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { categoryAccent } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import type { StoreCategory } from "@/services/catalog.service"

type MobileNavProps = {
  categories: StoreCategory[]
}

const linkClass =
  "flex items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"

/**
 * The header nav's mobile twin — `StoreNavMenu` (`store-nav.tsx`) is wrapped
 * in `hidden sm:flex` in `store-chrome.tsx` and had no `sm:hidden` sibling:
 * below the `sm` breakpoint the whole nav simply vanished, with nothing
 * replacing it. A shopper on a phone could reach the brand mark and the
 * auth/theme/cart icons (those sit outside the hidden wrapper) but never
 * «المتجر», «عن مِسك» or «حسابي» — there was no way to reach a category, the
 * story, or their own orders at all below that width.
 *
 * `NavigationMenu`'s hover dropdowns are the wrong shape for a touch
 * screen — nothing to hover on a phone, and a menu that only opens on tap
 * behaves like plain `Menu` at that point, at which point the flat list a
 * `Sheet` naturally gives is simpler than fighting the hover primitive into
 * a touch one. So this is a **different component**, not `StoreNavMenu`
 * rendered smaller — a slide-out `Sheet` (Base UI `Dialog` under the hood,
 * `components/ui/sheet.tsx`) holding the same destinations as flat,
 * grouped links. `side="right"` (the component's default) already opens
 * from the *start* edge in this RTL app — `right-0` is not flipped by
 * `dir="rtl"` in the primitive's own CSS, and `right` already **is** the
 * start edge here, so no `side` override is needed to get the conventional
 * "opens from the reading-start side" behaviour.
 *
 * Closes itself on every link click (`onClick={close}`) — a `Sheet` does not
 * do this on its own when its content is a `<Link>` rather than a
 * `SheetClose`, and leaving it open across a client-side navigation would
 * strand the drawer open over the new page.
 *
 * **Also holds `AuthNav` and `ThemeToggle`** — `store-chrome.tsx` hides both
 * from the mobile header row (`hidden sm:flex`) rather than cramming a
 * sign-in button and a theme toggle into the same narrow row that already
 * had to give up `StoreNavMenu` for this drawer. They live in a
 * `SheetFooter` at the bottom, not mixed into the link list above — they are
 * account/appearance controls, not destinations to navigate to, the same
 * distinction `StoreHeader` already draws by keeping them in their own
 * cluster apart from the nav.
 */
export function MobileNav({ categories }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={<Button variant="ghost" size="icon" aria-label="القائمة" />}
      >
        <MenuIcon aria-hidden="true" />
      </SheetTrigger>

      <SheetContent className="w-4/5 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>القائمة</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 pb-6">
          <Link href={ROUTES.home} onClick={close} className={linkClass}>
            الرئيسية
          </Link>

          <Separator className="my-2" />
          <p className="eyebrow px-2.5">المتجر</p>
          <Link href={ROUTES.store} onClick={close} className={linkClass}>
            كل المنتجات
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`${ROUTES.store}?category=${category.slug}`}
              onClick={close}
              className={linkClass}
            >
              <span
                aria-hidden="true"
                className={cn("size-1.5 rounded-full", categoryAccent(category.slug).bg)}
              />
              {category.name}
            </Link>
          ))}

          <Separator className="my-2" />
          <p className="eyebrow px-2.5">عن مِسك</p>
          <Link href={ROUTES.about} onClick={close} className={linkClass}>
            <BookOpenIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            حكايتنا
          </Link>
          <Link href={ROUTES.contact} onClick={close} className={linkClass}>
            <MessageCircleIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            تواصل معنا
          </Link>

          <Show when="signed-in">
            <Separator className="my-2" />
            <p className="eyebrow px-2.5">حسابي</p>
            <Link href={ROUTES.accountOrders} onClick={close} className={linkClass}>
              <ReceiptTextIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              طلباتي
            </Link>
            <Link href={ROUTES.cart} onClick={close} className={linkClass}>
              <ShoppingBagIcon className="size-4 text-muted-foreground" aria-hidden="true" />
              السلة
            </Link>
          </Show>
        </nav>

        <SheetFooter className="flex-row items-center justify-between border-t border-border">
          <AuthNav />
          <ThemeToggle />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
