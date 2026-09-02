"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ADMIN_NAV_ITEMS, isActiveNavItem } from "@/constants/admin-nav"
import { ROUTES } from "@/constants/routes"

/**
 * The «لوحة التحكم / العطور / …» trail in the admin header.
 *
 * Built from `ADMIN_NAV_ITEMS` rather than by splitting the URL, so a
 * segment gets its Arabic label instead of `products`. Segments with no nav
 * entry — a product id, `new` — fall through to a plain title-cased crumb,
 * which is right for an id and good enough for the rest until each detail
 * page passes its own.
 *
 * The separator is `aria-hidden` inside the shadcn component and the list is
 * a real `<ol>`, so a screen reader reads it as an ordered navigation list.
 */
function AdminBreadcrumbs() {
  const pathname = usePathname()

  const crumbs = React.useMemo(() => buildCrumbs(pathname), [pathname])

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          return (
            <React.Fragment key={crumb.href}>
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink render={<Link href={crumb.href} />}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {isLast ? null : <BreadcrumbSeparator />}
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

type Crumb = { label: string; href: string }

function buildCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: "لوحة التحكم", href: ROUTES.admin }]

  // Everything after `/admin`, accumulated back into full paths so each
  // crumb links to a real route rather than to a bare segment.
  const segments = pathname
    .replace(ROUTES.admin, "")
    .split("/")
    .filter(Boolean)

  // Annotated `string`: `ROUTES.admin` is a literal type, and Next.js's typed
  // routes would then reject the accumulated `/admin/products` below.
  let href: string = ROUTES.admin
  for (const segment of segments) {
    href = `${href}/${segment}`
    const navItem = ADMIN_NAV_ITEMS.find(
      (item) => !item.exact && isActiveNavItem(item, href)
    )
    crumbs.push({ label: navItem?.label ?? titleCase(segment), href })
  }

  return crumbs
}

/** `new-arrival` -> `New arrival`. A cuid stays a cuid, which is intended. */
function titleCase(segment: string): string {
  const spaced = segment.replace(/-/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export { AdminBreadcrumbs }
