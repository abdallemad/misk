import "server-only"

import { OrderStatus } from "@prisma/client"

import { LOW_STOCK_THRESHOLD } from "@/constants/design-system"
import { db } from "@/lib/db"

/**
 * Read-only queries behind the `/admin` overview.
 *
 * The dashboard is the one place the architecture lets a Server Component
 * call a service directly instead of going through a hook and an action:
 * there is nothing to mutate and nothing to cache, and the figures belong in
 * the first paint. See docs/folder-structure.md.
 */

export type DashboardStats = {
  products: number
  activeProducts: number
  orders: number
  openOrders: number
  users: number
  lowStockVariants: number
}

/** Order states that still need someone to do something. */
const OPEN_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.IN_PRODUCTION,
]

/**
 * The six numbers on the overview.
 *
 * Issued as one `$transaction` so every tile reflects the same instant —
 * six sequential counts could show 12 orders in one tile and 13 in the next
 * if an order lands between them, and a dashboard that contradicts itself
 * is worse than a slightly stale one. It is also a single round trip.
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, activeProducts, orders, openOrders, users, lowStockVariants] =
    await db.$transaction([
      db.product.count(),
      db.product.count({ where: { isActive: true } }),
      db.order.count(),
      db.order.count({ where: { status: { in: OPEN_ORDER_STATUSES } } }),
      db.user.count(),
      db.productVariant.count({
        where: { isActive: true, stock: { lte: LOW_STOCK_THRESHOLD } },
      }),
    ])

  return { products, activeProducts, orders, openOrders, users, lowStockVariants }
}
