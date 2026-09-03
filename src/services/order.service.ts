import "server-only"

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { ORDER_STATUSES, type OrderStatus } from "@/constants/design-system"
import { formatVariantLabel } from "@/utils/format"

/**
 * Order business logic — the only module that reads or writes the `Order` and
 * `OrderItem` tables for the admin console.
 *
 * Orders are **created by checkout**, not here (that is `payment.service.ts`
 * and the Stripe webhook — see docs/payments-feature.md). This module is
 * "read-first": the console lists orders, opens one to see its lines and its
 * shipping address, and can move its `status` along the fulfilment track. It
 * does **not** touch stock — a variant's stock moves at checkout and at
 * refund time, in the payment layer, and a manual status nudge here is not
 * either of those events.
 *
 * Every mutation returns a result object rather than throwing, the same
 * contract `category.service.ts` and `product.service.ts` use.
 */

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** One row of the admin orders table. */
export type OrderRow = {
  id: string
  status: OrderStatus
  totalPrice: number
  currency: string
  createdAt: Date
  itemCount: number
  customer: { id: string; name: string | null; email: string }
}

export type OrderListFilters = {
  search?: string
  page?: number
  status?: OrderStatus
}

export type OrderListResult = {
  orders: OrderRow[]
  total: number
  page: number
  pageCount: number
}

/** One line on the order detail page. */
export type OrderLineRow = {
  id: string
  productName: string
  productSlug: string
  variantLabel: string
  sku: string
  quantity: number
  unitPrice: number
  lineTotal: number
}

/** The shipping snapshot, or `null` for an order placed before the address
 *  was captured. `line1` present is treated as "there is an address". */
export type OrderShippingAddress = {
  name: string | null
  phone: string | null
  line1: string
  line2: string | null
  city: string | null
  governorate: string | null
  country: string | null
}

export type OrderDetail = {
  id: string
  status: OrderStatus
  totalPrice: number
  currency: string
  createdAt: Date
  updatedAt: Date
  customer: {
    id: string
    name: string | null
    email: string
    phone: string | null
    imageUrl: string | null
  }
  shipping: OrderShippingAddress | null
  items: OrderLineRow[]
}

export type OrderStatusResult =
  | { ok: true; status: OrderStatus }
  | { ok: false; message: string }

/* -------------------------------------------------------------------------
 * Constants
 * ---------------------------------------------------------------------- */

export const ORDERS_PAGE_SIZE = 20

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * One page of orders, newest first, narrowed by search and status.
 *
 * `search` matches the customer's name or email, or the start of the order id
 * (what the table prints as `#ABC123`). The count and the page are one
 * `$transaction` so the header total and the rows cannot disagree — the same
 * shape the products and customers lists use.
 */
export async function listOrders(
  filters: OrderListFilters = {}
): Promise<OrderListResult> {
  const search = filters.search?.trim() ?? ""
  const page = Math.max(1, Math.floor(filters.page ?? 1))

  const where: Prisma.OrderWhereInput = {
    ...(search
      ? {
          OR: [
            { id: { contains: search, mode: "insensitive" } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
    ...(filters.status ? { status: filters.status } : {}),
  }

  const [total, rows] = await db.$transaction([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ORDERS_PAGE_SIZE,
      take: ORDERS_PAGE_SIZE,
      include: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { items: true } },
        items: { select: { quantity: true } },
      },
    }),
  ])

  const orders: OrderRow[] = rows.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice.toNumber(),
    currency: order.currency,
    createdAt: order.createdAt,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    customer: order.user,
  }))

  return {
    orders,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ORDERS_PAGE_SIZE)),
  }
}

/**
 * One order with its customer, shipping snapshot and line items, or `null`.
 *
 * `null` rather than a throw for a missing row, so the page can `notFound()`
 * — a stale link to a deleted order is a 404, not a failure.
 *
 * Line labels are built from the **live** variant via `formatVariantLabel`.
 * An order-time label snapshot on `OrderItem` is a checkout concern; this
 * read-only view uses what the variant says now.
 */
export async function getOrder(id: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          imageUrl: true,
        },
      },
      items: {
        include: {
          variant: {
            include: {
              product: {
                select: { name: true, slug: true, productType: true },
              },
            },
          },
        },
      },
    },
  })

  if (!order) return null

  const items: OrderLineRow[] = order.items.map((item) => {
    const unitPrice = item.unitPrice.toNumber()
    return {
      id: item.id,
      productName: item.variant.product.name,
      productSlug: item.variant.product.slug,
      sku: item.variant.sku,
      variantLabel: formatVariantLabel({
        productType: item.variant.product.productType,
        bottleSize: item.variant.bottleSize,
        bottleStyle: item.variant.bottleStyle,
        oilWeight: item.variant.oilWeight,
      }),
      quantity: item.quantity,
      unitPrice,
      lineTotal: unitPrice * item.quantity,
    }
  })

  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice.toNumber(),
    currency: order.currency,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer: order.user,
    shipping: order.shippingLine1
      ? {
          name: order.shippingName,
          phone: order.shippingPhone,
          line1: order.shippingLine1,
          line2: order.shippingLine2,
          city: order.shippingCity,
          governorate: order.shippingGovernorate,
          country: order.shippingCountry,
        }
      : null,
    items,
  }
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

/**
 * Move an order to another status.
 *
 * The admin is trusted to pick the right next state — this is a fulfilment
 * tool, not a state machine, so any of the six statuses is allowed from any
 * other (a mis-click is fixed by picking again). What it will **not** do is
 * touch stock or payment: those move in `payment.service.ts` at checkout and
 * refund time, and a manual status change here is neither of those events.
 *
 * `P2025` (the row vanished between the page load and the submit) becomes a
 * message rather than a thrown digest.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<OrderStatusResult> {
  if (!ORDER_STATUSES.includes(status)) {
    return { ok: false, message: "حالة غير معروفة." }
  }

  try {
    const order = await db.order.update({
      where: { id },
      data: { status },
      select: { status: true },
    })
    return { ok: true, status: order.status }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { ok: false, message: "هذا الطلب لم يعد موجودًا." }
    }

    console.error("[order.service] status update failed", error)
    return { ok: false, message: "تعذّر تحديث حالة الطلب. حاول مرة أخرى." }
  }
}
