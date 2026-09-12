import "server-only"

import { clerkClient } from "@clerk/nextjs/server"
import { Prisma, type Role, type User } from "@prisma/client"

import { db } from "@/lib/db"
import { formatVariantLabel } from "@/utils/format"
import type { OrderStatus } from "@/constants/design-system"

/**
 * Customer business logic — the only module that touches the `User` table for
 * the admin console.
 *
 * A customer account is **owned by Clerk** and mirrored into Postgres by
 * `syncCurrentUser()` on every visit to `/auth-callback` (see
 * docs/auth-callback.md). So the console can read freely — list, search, order
 * history — but it can write exactly one field: `role`.
 *
 * `role` is writable here because it is the one piece of a customer the shop
 * genuinely owns a decision about, and `setCustomerRole` writes it **to Clerk
 * first** (the source of truth `/admin` is gated on) and lets the Postgres
 * mirror follow. It is still not a free-for-all — the Server Action above it
 * blocks an admin changing their own role, so this stays a "promote a
 * colleague" tool and not a self-service escalation. The bootstrap first
 * admin still comes from `npm run grant-admin`. See
 * docs/admin-access-control.md.
 *
 * Everything else is reads, and the list pages follow the documented
 * exception the categories and products lists take: a Server Component calls
 * straight into here, because the data is read-only and belongs in the first
 * paint.
 */

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** One row of the admin customers table. */
export type CustomerRow = {
  id: string
  name: string | null
  email: string
  imageUrl: string | null
  role: Role
  createdAt: Date
  orderCount: number
  /**
   * Lifetime value — the sum of every order's `totalPrice` **except**
   * cancelled ones. A number, not a `Decimal`: it is rendered and compared,
   * never charged, and `Decimal(10,2)` totals fit inside a double with room
   * to spare (the same call `product.service.ts` documents on
   * `toDisplayPrice`).
   */
  totalSpent: number
  /** When the most recent order was placed, or `null` for a customer who has
   *  never ordered. */
  lastOrderAt: Date | null
}

/** How the admin customers list is narrowed. All optional, combined with AND. */
export type CustomerListFilters = {
  search?: string
  page?: number
  role?: Role
}

export type CustomerListResult = {
  customers: CustomerRow[]
  /** Total customers matching the filters — what the pager counts, not the
   *  length of `customers`. */
  total: number
  page: number
  pageCount: number
}

export type CustomerRoleResult =
  | { ok: true; role: Role }
  | { ok: false; message: string }

/** One order on a customer's history table. */
export type CustomerOrderRow = {
  id: string
  status: OrderStatus
  totalPrice: number
  currency: string
  createdAt: Date
  itemCount: number
  items: {
    id: string
    productName: string
    variantLabel: string
    quantity: number
    unitPrice: number
  }[]
}

/** Everything the detail page needs, and nothing the table does not. */
export type CustomerDetail = {
  id: string
  clerkId: string
  name: string | null
  email: string
  imageUrl: string | null
  phone: string | null
  role: Role
  createdAt: Date
  updatedAt: Date
  orderCount: number
  totalSpent: number
  lastOrderAt: Date | null
  orders: CustomerOrderRow[]
}

/* -------------------------------------------------------------------------
 * Constants
 * ---------------------------------------------------------------------- */

/** Page size for the customers list. Small enough that the page stays one
 *  screen, large enough that a shop with a few dozen accounts fits on it. */
export const CUSTOMERS_PAGE_SIZE = 20

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * A page of customers, newest sign-up first, each with its order count,
 * lifetime value and last-order date.
 *
 * `search` matches `name` or `email`, case-insensitively; `role` narrows to
 * admins or plain customers. The aggregates are computed in memory from an
 * `orders` include rather than in SQL: the page is capped at
 * {@link CUSTOMERS_PAGE_SIZE} rows, so at most that many customers' orders are
 * pulled, and doing it here keeps one query where a `groupBy` would be a
 * second. This is the same trade `product.service.listProducts` makes for its
 * price range.
 *
 * The day this shop has thousands of customers with long histories, this
 * becomes a real `groupBy` (or a denormalised counter on `User`) — and that
 * is also the day the list needs the React Query hook layer for client-side
 * paging. Until then, server-rendered and URL-driven is simpler and correct.
 */
export async function listCustomers(
  params: CustomerListFilters
): Promise<CustomerListResult> {
  const search = params.search?.trim() ?? ""
  const page = Math.max(1, Math.floor(params.page ?? 1))

  const where: Prisma.UserWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(params.role ? { role: params.role } : {}),
  }

  const [total, users] = await db.$transaction([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * CUSTOMERS_PAGE_SIZE,
      take: CUSTOMERS_PAGE_SIZE,
      include: {
        orders: {
          select: { totalPrice: true, status: true, createdAt: true },
        },
      },
    }),
  ])

  const customers: CustomerRow[] = users.map((user) => {
    const spent = user.orders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.totalPrice.toNumber(), 0)

    const lastOrderAt = user.orders.reduce<Date | null>((latest, order) => {
      return !latest || order.createdAt > latest ? order.createdAt : latest
    }, null)

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      imageUrl: user.imageUrl,
      role: user.role,
      createdAt: user.createdAt,
      orderCount: user.orders.length,
      totalSpent: spent,
      lastOrderAt,
    }
  })

  return {
    customers,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE)),
  }
}

/**
 * One customer by id, with their full order history, or `null`.
 *
 * `null` rather than a throw for a missing row: a stale bookmark to a deleted
 * account is a 404, not a failure — the same treatment `getProduct` gives.
 *
 * Orders come back newest first, each with its line items already flattened
 * into `{ productName, variantLabel, quantity, unitPrice }`. The label is
 * built from the *live* variant here; an order-time label snapshot belongs on
 * `OrderItem` and is the job of the checkout/orders feature, not this
 * read-only view.
 */
export async function getCustomer(id: string): Promise<CustomerDetail | null> {
  const user = await db.user.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              variant: {
                include: {
                  product: { select: { name: true, productType: true } },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user) return null

  const orders: CustomerOrderRow[] = user.orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice.toNumber(),
    currency: order.currency,
    createdAt: order.createdAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items.map((item) => ({
      id: item.id,
      productName: item.variant.product.name,
      variantLabel: formatVariantLabel({
        productType: item.variant.product.productType,
        bottleSize: item.variant.bottleSize,
        oilWeight: item.variant.oilWeight,
      }),
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
    })),
  }))

  const totalSpent = orders
    .filter((order) => order.status !== "CANCELLED")
    .reduce((sum, order) => sum + order.totalPrice, 0)

  return {
    id: user.id,
    clerkId: user.clerkId,
    name: user.name,
    email: user.email,
    imageUrl: user.imageUrl,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    orderCount: orders.length,
    totalSpent,
    lastOrderAt: orders[0]?.createdAt ?? null,
    orders,
  }
}

/* -------------------------------------------------------------------------
 * Writes — the one field the console owns
 * ---------------------------------------------------------------------- */

/**
 * Promote a customer to `ADMIN`, or demote them back to `USER`.
 *
 * **Clerk is written first.** `/admin` gates on the Clerk `publicMetadata.role`,
 * not on this table (docs/admin-access-control.md), so a change that only
 * touched Postgres would grant nothing — and a change that touched Postgres
 * first and then failed at Clerk would leave the mirror lying. The Postgres
 * row is updated only after the Clerk write returns.
 *
 * A `clerkId` that Clerk does not recognise — a seed-script account
 * (`seed_dev_*`), or a user deleted in Clerk — comes back as a 404 and is
 * turned into a message the admin can act on, rather than a thrown digest.
 *
 * Whether the *caller* is allowed to do this at all, and the "you cannot
 * change your own role" rule, live in the Server Action
 * (`actions/customer/set-role.ts`) — this function assumes it has been
 * authorised.
 */
export async function setCustomerRole(
  id: string,
  role: Role
): Promise<CustomerRoleResult> {
  const user = await db.user.findUnique({
    where: { id },
    select: { clerkId: true },
  })

  if (!user) return { ok: false, message: "هذا الحساب لم يعد موجودًا." }

  try {
    const clerk = await clerkClient()
    await clerk.users.updateUserMetadata(user.clerkId, {
      publicMetadata: { role },
    })
  } catch (error) {
    if (isClerkNotFound(error)) {
      return {
        ok: false,
        message:
          "لا يوجد حساب مطابق في Clerk لهذا المستخدم، فلا يمكن تغيير دوره.",
      }
    }

    console.error("[customer.service] Clerk role update failed", error)
    return { ok: false, message: "تعذّر تغيير الدور. حاول مرة أخرى." }
  }

  const updated = await db.user.update({ where: { id }, data: { role } })
  return { ok: true, role: updated.role }
}

/** Clerk's backend SDK throws with a numeric `status` on its errors. */
function isClerkNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: number }).status === 404
  )
}

/** Re-exported so a caller that only needs the row type does not also import
 *  `@prisma/client`. */
export type { Role, User }
