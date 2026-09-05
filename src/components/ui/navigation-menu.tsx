"use client"

import * as React from "react"
import { NavigationMenu as NavigationMenuPrimitive } from "@base-ui/react/navigation-menu"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * The site's hover-triggered nav dropdowns (`store-nav.tsx`) — Base UI's
 * `NavigationMenu`, not the click-only `Menu` `dropdown-menu.tsx` already
 * wraps. The two exist for different jobs in this same file tree: `Menu` is
 * for an action list attached to one row (a status control, a delete
 * confirm), triggered by a click; `NavigationMenu` is built for a persistent
 * header bar — its trigger "opens the popup when hovered *or* clicked"
 * (Base UI's own doc comment), which a plain `Menu` does not do on its own.
 * See docs/store-feature.md.
 */

function NavigationMenu({
  className,
  ...props
}: NavigationMenuPrimitive.Root.Props) {
  return (
    <NavigationMenuPrimitive.Root
      data-slot="navigation-menu"
      className={cn("relative", className)}
      {...props}
    />
  )
}

function NavigationMenuList({
  className,
  ...props
}: NavigationMenuPrimitive.List.Props) {
  return (
    <NavigationMenuPrimitive.List
      data-slot="navigation-menu-list"
      className={cn("flex list-none items-center gap-1 p-0", className)}
      {...props}
    />
  )
}

function NavigationMenuItem({
  ...props
}: NavigationMenuPrimitive.Item.Props) {
  return <NavigationMenuPrimitive.Item data-slot="navigation-menu-item" {...props} />
}

/** Matches `buttonVariants({ variant: "ghost", size: "sm" })` so a dropdown
 *  trigger sits beside a plain `<Link>` nav item without looking like a
 *  different control. */
function NavigationMenuTrigger({
  className,
  children,
  ...props
}: NavigationMenuPrimitive.Trigger.Props) {
  return (
    <NavigationMenuPrimitive.Trigger
      data-slot="navigation-menu-trigger"
      className={cn(
        "inline-flex h-7 items-center justify-center gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] font-medium whitespace-nowrap outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted data-popup-open:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <NavigationMenuPrimitive.Icon className="transition-transform duration-200 data-popup-open:rotate-180">
        <ChevronDownIcon className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </NavigationMenuPrimitive.Icon>
    </NavigationMenuPrimitive.Trigger>
  )
}

function NavigationMenuContent({
  className,
  ...props
}: NavigationMenuPrimitive.Content.Props) {
  return (
    <NavigationMenuPrimitive.Content
      data-slot="navigation-menu-content"
      className={cn(
        "w-max min-w-48 p-1.5 transition-[opacity,transform] duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

/** `render`s the caller's own `<Link>` — the same `render`-prop composition
 *  `Button` already uses to become a Next `<Link>` elsewhere in this project
 *  (see `adminCustomerRoute` link on `/admin/orders/[id]`), applied here so
 *  a nav item is a real client-navigable `<Link>`, not a Base UI-owned `<a>`. */
function NavigationMenuLink({
  className,
  ...props
}: NavigationMenuPrimitive.Link.Props) {
  return (
    <NavigationMenuPrimitive.Link
      data-slot="navigation-menu-link"
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuPortal({ ...props }: NavigationMenuPrimitive.Portal.Props) {
  return <NavigationMenuPrimitive.Portal {...props} />
}

function NavigationMenuPositioner({
  className,
  sideOffset = 8,
  ...props
}: NavigationMenuPrimitive.Positioner.Props) {
  return (
    <NavigationMenuPrimitive.Positioner
      data-slot="navigation-menu-positioner"
      sideOffset={sideOffset}
      className={cn("z-50 max-w-(--available-width)", className)}
      {...props}
    />
  )
}

function NavigationMenuPopup({
  className,
  ...props
}: NavigationMenuPrimitive.Popup.Props) {
  return (
    <NavigationMenuPrimitive.Popup
      data-slot="navigation-menu-popup"
      className={cn(
        "relative h-(--popup-height) w-(--popup-width) origin-(--transform-origin) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 transition-[width,height] duration-150",
        className
      )}
      {...props}
    />
  )
}

function NavigationMenuViewport({
  className,
  ...props
}: NavigationMenuPrimitive.Viewport.Props) {
  return (
    <NavigationMenuPrimitive.Viewport
      data-slot="navigation-menu-viewport"
      className={cn("relative h-full w-full", className)}
      {...props}
    />
  )
}

export {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuPopup,
  NavigationMenuViewport,
}
