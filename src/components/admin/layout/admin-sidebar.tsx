"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { StoreIcon } from "lucide-react"

import { BrandLockup } from "@/components/shared/brand-lockup"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { ADMIN_NAV, isActiveNavItem } from "@/constants/admin-nav"
import { ROUTES } from "@/constants/routes"

/**
 * The admin rail.
 *
 * A Client Component for exactly one reason: `usePathname()`, to mark the
 * active item. Everything it renders comes from `ADMIN_NAV`, so it holds no
 * data of its own and never talks to a service — the layout above it stays a
 * Server Component and keeps the guard on the server.
 *
 * `side="right"`: the console is RTL, so the rail belongs on the right. The
 * underlying shadcn sidebar is written with logical properties (`border-e`,
 * `start`/`end`), so the collapse animation and the rail handle mirror
 * correctly without a second stylesheet.
 */
function AdminSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpenMobile } = useSidebar()

  // On mobile the rail is a sheet overlaying the content. Tapping a link has
  // to close it, or the user navigates and then stares at the menu they just
  // used. On desktop the rail is persistent, so leave it alone.
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false)
  }

  return (
    <Sidebar side="right" collapsible="icon" variant="inset">
      <SidebarHeader className="h-16 justify-center px-2">
        <Link
          href={ROUTES.admin}
          onClick={closeOnMobile}
          aria-label="مِسك — لوحة التحكم"
          className="flex items-center rounded-md px-1 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
        >
          {/* The wordmark is dead weight at 3rem wide, so the collapsed rail
              shows the mark alone. Both are always in the DOM — swapping via
              CSS keeps the transition smooth and avoids a layout jump. */}
          <span className="group-data-[collapsible=icon]:hidden">
            <BrandLockup href={false} size="sm" tagline="لوحة التحكم" />
          </span>
          <span className="hidden group-data-[collapsible=icon]:inline-flex">
            <BrandLockup href={false} variant="mark" size="sm" />
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="mx-0" />

      <SidebarContent>
        {ADMIN_NAV.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = isActiveNavItem(item, pathname)
                  return (
                    <SidebarMenuItem key={item.href}>
                      {/* Base UI composes through `render`, not `asChild`:
                          the button's props and styling are merged onto this
                          Link, so the nav item is a real anchor. */}
                      <SidebarMenuButton
                        render={<Link href={item.href} />}
                        isActive={active}
                        tooltip={item.label}
                        onClick={closeOnMobile}
                        // Communicates "you are here" to assistive tech — the
                        // data-active styling alone is invisible to it.
                        aria-current={active ? "page" : undefined}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            {/* The way back out. An admin is a shopper too, and without this
                the console is a room with no door. */}
            <SidebarMenuButton
              render={<Link href={ROUTES.home} />}
              tooltip="العودة إلى المتجر"
              onClick={closeOnMobile}
            >
              <StoreIcon aria-hidden="true" />
              <span>العودة إلى المتجر</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}

export { AdminSidebar }
