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
import { useBreadcrumbTitle } from "@/components/admin/layout/breadcrumb-title"
import { ADMIN_NAV_ITEMS } from "@/constants/admin-nav"
import { ROUTES } from "@/constants/routes"

/**
 * The «لوحة التحكم / العطور / …» trail in the admin header.
 *
 * Labels come from `ADMIN_NAV_ITEMS`, matched by **exact href** — not by
 * prefix. Prefix matching lit the section's label for its own sub-segments
 * too, so `/admin/products/<id>` rendered «… / العطور / العطور». An exact
 * match means the id segment falls through to the fallbacks below.
 *
 * The last crumb, if it has no nav entry, prefers the title a detail page
 * registered through `BreadcrumbTitle` (a product name, a customer name). If
 * none is registered yet — the render before the page's effect runs — an
 * opaque id shows as «…» rather than a raw cuid, and a plain word is
 * title-cased.
 */
function AdminBreadcrumbs() {
  const pathname = usePathname()
  const registeredTitle = useBreadcrumbTitle()

  const crumbs = React.useMemo(
    () => buildCrumbs(pathname, registeredTitle),
    [pathname, registeredTitle]
  )

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

function buildCrumbs(pathname: string, registeredTitle: string | null): Crumb[] {
  const crumbs: Crumb[] = [{ label: "لوحة التحكم", href: ROUTES.admin }]

  const segments = pathname
    .replace(ROUTES.admin, "")
    .split("/")
    .filter(Boolean)

  // Annotated `string`: `ROUTES.admin` is a literal type, and Next.js's typed
  // routes would then reject the accumulated `/admin/products` below.
  let href: string = ROUTES.admin
  segments.forEach((segment, index) => {
    href = `${href}/${segment}`
    const isLast = index === segments.length - 1
    const navItem = ADMIN_NAV_ITEMS.find((item) => item.href === href)

    if (navItem) {
      crumbs.push({ label: navItem.label, href })
      return
    }

    if (isLast && registeredTitle) {
      crumbs.push({ label: registeredTitle, href })
      return
    }

    crumbs.push({
      label: looksLikeId(segment) ? "…" : titleCase(segment),
      href,
    })
  })

  return crumbs
}

/** A cuid, or anything else with no business being shown to a person. */
function looksLikeId(segment: string): boolean {
  return /^c[a-z0-9]{16,}$/i.test(segment) || segment.length > 20
}

/** `new-arrival` -> `New arrival`. */
function titleCase(segment: string): string {
  const spaced = segment.replace(/-/g, " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

export { AdminBreadcrumbs }
