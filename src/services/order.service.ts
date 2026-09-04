import "server-only"

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"
import { ORDER_STATUSES, type OrderStatus } from "@/constants/design-system"
import { getCart, clearCart } from "@/services/cart.service"
import type { CheckoutFormInput } from "@/schemas/checkout.schema"
import { formatVariantLabel } from "@/utils/format"

/**
 * Order business logic — the only module that reads or writes the `Order` and
 * `OrderItem` tables, for **both** callers: the admin console (read-first,
 * plus the one status write) and checkout (the one place an order is
 * created). One entity, one owner, regardless of who is asking — the same
 * rule `product.service.ts` follows for `Product`.
 *
 * The console's own summary still holds: it lists orders, opens one to see
 * its lines and shipping address, and can move `status` along the fulfilment
 * track, touching neither stock nor payment when it does.
 *
 * **Checkout is cash-on-delivery, not Stripe.** `docs/folder-structure.md`
 * sketches order creation as `payment.service.ts`'s job, reacting to a
 * webhook that confirms payment happened. There is no such event here — a
 * COD order *is* the commitment, made the moment it is placed — so
 * `createOrder` below both writes the order and decrements variant stock in
 * one transaction, rather than splitting that across a service that does not
 * exist for a payment method that never confirms asynchronously. See
 * docs/checkout-orders-feature.md.
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
  /** The alternate contact number checkout collects, or `null` when none was
   *  given (and always `null` on an order placed before this column existed). */
  phone2: string | null
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

/** The `include` both `getOrder` and `getOrderForUser` need — one order's
 *  customer and its line items, each with enough of the live variant to
 *  build a label. Shared so the two queries cannot quietly drift apart. */
const ORDER_DETAIL_INCLUDE = {
  user: {
    select: { id: true, name: true, email: true, phone: true, imageUrl: true },
  },
  items: {
    include: {
      variant: {
        include: {
          product: { select: { name: true, slug: true, productType: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude

type OrderWithDetail = Prisma.OrderGetPayload<{ include: typeof ORDER_DETAIL_INCLUDE }>

/**
 * `OrderWithDetail` → `OrderDetail`. The one place the shipping columns and
 * the line items are flattened, so `getOrder` (any order, admin-only caller)
 * and `getOrderForUser` (one shopper's own order) can never format one
 * differently from the other.
 *
 * Line labels are built from the **live** variant via `formatVariantLabel`.
 * An order-time label snapshot on `OrderItem` is a checkout concern this
 * read-only mapper does not need; it uses what the variant says now.
 */
function mapOrderDetail(order: OrderWithDetail): OrderDetail {
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
          phone2: order.shippingPhone2,
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

/**
 * One order with its customer, shipping snapshot and line items, or `null`.
 *
 * `null` rather than a throw for a missing row, so the page can `notFound()`
 * — a stale link to a deleted order is a 404, not a failure.
 *
 * **Admin-only in practice**: this looks up an order by id with no ownership
 * check, which is correct for `/admin/orders/[id]` (an admin may see any
 * order) and wrong for anything customer-facing — see `getOrderForUser`.
 */
export async function getOrder(id: string): Promise<OrderDetail | null> {
  const order = await db.order.findUnique({
    where: { id },
    include: ORDER_DETAIL_INCLUDE,
  })

  return order ? mapOrderDetail(order) : null
}

/**
 * One order, but only if it belongs to `userId` — the customer-facing twin
 * of `getOrder`.
 *
 * `where: { id, userId }` rather than "fetch by id, then check the owner in
 * JavaScript": a mismatched owner and a missing row read as the exact same
 * `null` here, which is what lets `/account/orders/[id]` answer a guessed id
 * belonging to someone else with an honest 404 instead of confirming the id
 * exists by leaking a "yes, but it is not yours" distinction.
 */
export async function getOrderForUser(
  userId: string,
  id: string
): Promise<OrderDetail | null> {
  const order = await db.order.findFirst({
    where: { id, userId },
    include: ORDER_DETAIL_INCLUDE,
  })

  return order ? mapOrderDetail(order) : null
}

/** One row of a shopper's own order history — `/account/orders`. */
export type MyOrderRow = {
  id: string
  status: OrderStatus
  totalPrice: number
  currency: string
  createdAt: Date
  itemCount: number
}

/**
 * One shopper's own orders, newest first — no paging.
 *
 * The same call `customer.service.getCustomer` makes for a customer's order
 * history on the admin side: one person's orders are bounded, so a second
 * round trip to page through them buys nothing.
 */
export async function listOrdersForUser(userId: string): Promise<MyOrderRow[]> {
  const orders = await db.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { select: { quantity: true } } },
  })

  return orders.map((order) => ({
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice.toNumber(),
    currency: order.currency,
    createdAt: order.createdAt,
    itemCount: order.items.reduce((total, item) => total + item.quantity, 0),
  }))
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

export type OrderCreateResult =
  | { ok: true; orderId: string }
  | { ok: false; message: string }

/** Raised inside the transaction when a variant no longer has enough stock
 *  to cover what the cart asked for — caught by `createOrder`, never leaks. */
class InsufficientStockError extends Error {
  constructor(public readonly productName: string) {
    super(`Insufficient stock for "${productName}".`)
    this.name = "InsufficientStockError"
  }
}

/**
 * Place a cash-on-delivery order from the shopper's current cart.
 *
 * Four things happen, in one transaction, or none of them do:
 *
 *   1. Every cart line's variant is re-read live — active, with enough
 *      stock — and its *current* price is what gets charged, never the
 *      price `getCart()` resolved a moment earlier. The gap between "the
 *      cart page rendered" and "the order button was pressed" is exactly
 *      the window a race lives in; re-deriving inside the transaction is
 *      the same "checked before insert, not after" discipline
 *      `product.service.mintSkus` uses for SKUs.
 *   2. The `Order` and its `OrderItem`s are created, with the shipping
 *      snapshot this call was given — `checkout.schema.ts` validated it
 *      already, so this function trusts its shape.
 *   3. Each ordered variant's `stock` is decremented by the quantity
 *      bought. **This is the one place in the app that happens** — see the
 *      module doc for why it lives here rather than in a `payment.service.ts`
 *      reacting to a webhook that a cash-on-delivery order does not have.
 *   4. The cart is cleared, **after** the transaction commits — clearing
 *      first and having the order fail would strand the shopper with an
 *      empty cart and nothing to show for it.
 *
 * Returns `{ ok: false, message }` naming the perfume that ran out, rather
 * than a generic failure — a shopper who was about to pay on delivery for
 * something no longer in stock deserves to know which line to remove.
 */
export async function createOrder(
  userId: string,
  input: CheckoutFormInput
): Promise<OrderCreateResult> {
  const cart = await getCart()

  if (cart.lines.length === 0) {
    return { ok: false, message: "السلة فارغة." }
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true },
  })

  try {
    const order = await db.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          id: { in: cart.lines.map((line) => line.variantId) },
          isActive: true,
          product: { isActive: true },
        },
        select: {
          id: true,
          price: true,
          stock: true,
          product: { select: { name: true } },
        },
      })

      const byId = new Map(variants.map((variant) => [variant.id, variant]))

      const orderItems = cart.lines.map((line) => {
        const variant = byId.get(line.variantId)

        if (!variant || variant.stock < line.quantity) {
          throw new InsufficientStockError(
            variant?.product.name ?? line.productName
          )
        }

        return {
          variantId: variant.id,
          quantity: line.quantity,
          // A string, straight from the column — never the number `getCart()`
          // rendered a moment ago. See the function doc.
          unitPrice: variant.price,
        }
      })

      const totalPrice = orderItems.reduce(
        (sum, item) => sum.add(item.unitPrice.times(item.quantity)),
        new Prisma.Decimal(0)
      )

      const created = await tx.order.create({
        data: {
          userId,
          status: "PENDING",
          totalPrice,
          // The stored default is still "SAR" (a pre-existing mismatch
          // `docs/orders-feature.md` already flags), but every price this
          // shop actually shows and charges is EGP — an order created here
          // says so explicitly rather than perpetuating the stale default.
          currency: "EGP",
          shippingName: user?.name ?? null,
          shippingPhone: input.phone,
          shippingPhone2: input.phone2,
          shippingLine1: input.street,
          shippingCity: input.city,
          shippingCountry: "EG",
          items: { create: orderItems },
        },
        select: { id: true },
      })

      for (const item of orderItems) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        })
      }

      return created
    })

    // Only once the order has committed — see the function doc.
    await clearCart()

    return { ok: true, orderId: order.id }
  } catch (error) {
    if (error instanceof InsufficientStockError) {
      return {
        ok: false,
        message: `الكمية المطلوبة من «${error.productName}» لم تعد متوفرة بالكامل. عدّل السلة وحاول مرة أخرى.`,
      }
    }

    console.error("[order.service] create failed", error)
    return { ok: false, message: "تعذّر إتمام الطلب. حاول مرة أخرى." }
  }
}

/**
 * Move an order to another status.
 *
 * The admin is trusted to pick the right next state — this is a fulfilment
 * tool, not a state machine, so any of the six statuses is allowed from any
 * other (a mis-click is fixed by picking again). What it will **not** do is
 * touch stock: stock moves once, at `createOrder` time (see the module doc
 * for why there is no separate payment-confirmation event for a
 * cash-on-delivery order to move it again), and a manual status change here
 * is not that event.
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
