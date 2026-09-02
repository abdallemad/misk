import {
  BoxesIcon,
  LayoutDashboardIcon,
  PackageIcon,
  ReceiptTextIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react"

import { ROUTES } from "@/constants/routes"

/**
 * The admin sidebar, as data.
 *
 * The sidebar component renders whatever is in here and nothing else, so
 * adding a section to the console is a one-entry edit rather than a JSX
 * change — and the same list drives the breadcrumb trail in the header, so
 * the two can never disagree about what a route is called.
 */

export type AdminNavItem = {
  /** Arabic label — the console is RTL, same as the storefront. */
  label: string
  href: string
  icon: LucideIcon
  /**
   * When true the item highlights only on an exact path match. Set on the
   * overview, whose href is a prefix of every other admin route and would
   * otherwise stay lit on every page.
   */
  exact?: boolean
  /** Short line under the title on that section's page header. */
  description: string
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "نظرة عامة",
    items: [
      {
        label: "لوحة التحكم",
        href: ROUTES.admin,
        icon: LayoutDashboardIcon,
        exact: true,
        description: "أرقام اليوم: الطلبات، المخزون، والعملاء.",
      },
    ],
  },
  {
    label: "الكتالوج",
    items: [
      {
        label: "العطور",
        href: ROUTES.adminProducts,
        icon: PackageIcon,
        description: "إضافة وتعديل العطور وأحجامها وأسعارها.",
      },
      {
        label: "الفئات",
        href: ROUTES.adminCategories,
        icon: BoxesIcon,
        description: "شبابي، نسائي، رجالي — وما يندرج تحت كلٍّ منها.",
      },
    ],
  },
  {
    label: "المبيعات",
    items: [
      {
        label: "الطلبات",
        href: ROUTES.adminOrders,
        icon: ReceiptTextIcon,
        description: "متابعة حالة الطلبات من الدفع حتى التسليم.",
      },
      {
        label: "العملاء",
        href: ROUTES.adminCustomers,
        icon: UsersIcon,
        description: "الحسابات المُزامَنة من Clerk وسجل طلباتها.",
      },
    ],
  },
  {
    label: "الإعدادات",
    items: [
      {
        label: "إعدادات المتجر",
        href: ROUTES.adminSettings,
        icon: SettingsIcon,
        description: "بيانات المتجر، العملة، وتفضيلات الشحن.",
      },
    ],
  },
]

/** Flat view of every nav item — for breadcrumb and active-item lookups. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV.flatMap(
  (group) => group.items
)

/**
 * Is `href` the section the user is currently in?
 *
 * Prefix matching, so `/admin/products/new` still lights up «العطور» — with
 * a `/` guard so `/admin/products-archive` does not. `exact` items opt out
 * of prefix matching entirely.
 */
export function isActiveNavItem(item: AdminNavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.href
  return pathname === item.href || pathname.startsWith(`${item.href}/`)
}

/**
 * The deepest nav item matching `pathname`, or `undefined` for a route with
 * no sidebar entry. "Deepest" matters because `/admin` prefixes everything:
 * on `/admin/products` we want «العطور», not «لوحة التحكم».
 */
export function findNavItem(pathname: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.filter((item) => isActiveNavItem(item, pathname)).sort(
    (a, b) => b.href.length - a.href.length
  )[0]
}
