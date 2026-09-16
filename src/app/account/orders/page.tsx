import { redirect } from "next/navigation"

import { AccountOrdersTable } from "@/components/account/account-orders-table"
import { ROUTES } from "@/constants/routes"
import { getCurrentUser } from "@/services/auth.service"
import { listOrdersForUser } from "@/services/order.service"

export const metadata = { title: "طلباتي" }

/**
 * `/account/orders` — the shopper's own order history.
 *
 * Read-first, the same exception every list in this app takes. No search, no
 * status filter, no paging — `listOrdersForUser` is deliberately the simple
 * half of `order.service.ts`: one person's orders are bounded, the same call
 * `customer.service.getCustomer` already makes for this exact table on the
 * admin side.
 *
 * `getCurrentUser()` rather than trusting `account/layout.tsx`'s
 * `auth.protect()` alone — a defensive second check, same reasoning as
 * `/checkout`. See docs/checkout-orders-feature.md.
 */
export default async function AccountOrdersPage() {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.signIn)

  const orders = await listOrdersForUser(user.id)

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="eyebrow">حسابي</p>
        <h1 className="mt-2 text-display-md sm:text-display-lg">طلباتي</h1>
      </header>

      <div className="mt-8 overflow-hidden rounded-xl border border-border">
        <AccountOrdersTable orders={orders} />
      </div>
    </div>
  )
}
