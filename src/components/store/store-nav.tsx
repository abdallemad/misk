"use client"

import Link from "next/link"
import { Show } from "@clerk/nextjs"
import { ReceiptTextIcon, ShoppingBagIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { categoryAccent } from "@/constants/design-system"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { formatNumber } from "@/utils/format"
import type { StoreCategory } from "@/services/catalog.service"

type StoreNavMenuProps = {
  categories: StoreCategory[]
}

/**
 * The header's nav — «الرئيسية» stays a plain link (one destination, nothing
 * to group), while «المتجر» and «حسابي» are hover-triggered dropdowns over
 * Base UI's `NavigationMenu` (`components/ui/navigation-menu.tsx`), not the
 * click-only `Menu` `dropdown-menu.tsx` wraps — a header needs a trigger that
 * opens on hover, the same distinction the component's own doc comment makes.
 *
 * A Client Component because `NavigationMenu` is (Base UI's popup state is
 * client-side) and because `<Show>` needs to know the auth state. The
 * category data itself is still fetched server-side, by `StoreHeader`, and
 * handed down as a plain prop — the same split `StoreCategoryNav` already
 * uses on `/store` for its (Server Component) category chips.
 */
export function StoreNavMenu({ categories }: StoreNavMenuProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href={ROUTES.home} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            الرئيسية
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>المتجر</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="flex w-56 flex-col gap-0.5">
              <li>
                <NavigationMenuLink render={<Link href={ROUTES.store} />}>
                  كل المنتجات
                </NavigationMenuLink>
              </li>
              {categories.map((category) => (
                <li key={category.id}>
                  <NavigationMenuLink
                    render={<Link href={`${ROUTES.store}?category=${category.slug}`} />}
                  >
                    <span
                      aria-hidden="true"
                      className={cn("size-1.5 rounded-full", categoryAccent(category.slug).bg)}
                    />
                    {category.name}
                    <span className="ms-auto text-xs tabular-nums text-muted-foreground">
                      {formatNumber(category.productCount)}
                    </span>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Only a shopper who is signed in has orders to see — matching
            `/account/orders` itself, which redirects a signed-out visitor
            straight to `/sign-in` anyway. «السلة» is repeated here (it is
            also its own icon-button in the header) so a signed-in shopper
            finds it under «حسابي» too, next to «طلباتي» — a second path to
            the same route, not a replacement for the icon. */}
        <Show when="signed-in">
          <NavigationMenuItem>
            <NavigationMenuTrigger>حسابي</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="flex w-40 flex-col gap-0.5">
                <li>
                  <NavigationMenuLink render={<Link href={ROUTES.accountOrders} />}>
                    <ReceiptTextIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    طلباتي
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink render={<Link href={ROUTES.cart} />}>
                    <ShoppingBagIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                    السلة
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </Show>
      </NavigationMenuList>

      <NavigationMenuPortal>
        <NavigationMenuPositioner>
          <NavigationMenuPopup>
            <NavigationMenuViewport />
          </NavigationMenuPopup>
        </NavigationMenuPositioner>
      </NavigationMenuPortal>
    </NavigationMenu>
  )
}
