import "server-only"

import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/constants/cart"
import { readCartCookie, writeCartCookie } from "@/lib/cart"
import { db } from "@/lib/db"
import type { CartCookie } from "@/schemas/cart.schema"
import { formatVariantLabel } from "@/utils/format"

/**
 * Cart business logic — the only module that reads or writes the cart
 * cookie's *contents against the database*. `lib/cart.ts` moves bytes in and
 * out of the cookie; this module decides what a legal cart is.
 *
 * There is no `Cart` / `CartItem` table. See docs/cart-feature.md for the
 * reasoning; the short version is that a cookie needs no anonymous-to-account
 * merge and no schema change, and this feature is deliberately cart-only —
 * checkout, which is where a cart's contents would need to become durable
 * rows, is not built here.
 *
 * Every mutation re-reads the variant from the database before touching the
 * cookie. The cookie only ever holds `{ variantId, quantity }` — never a
 * price, a name or a stock figure — so nothing it holds can go stale in a way
 * that costs the shop money; `getCart()` re-derives everything from the
 * database on every read.
 */

/* -------------------------------------------------------------------------
 * Types
 * ---------------------------------------------------------------------- */

/** One row in the cart, with everything the cart page renders. */
export type CartLine = {
  variantId: string
  productSlug: string
  productName: string
  /** "100ml" or "8g" — `formatVariantLabel`. */
  label: string
  oilGrade: string | null
  imageUrl: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
  /** Current stock — the quantity stepper's ceiling. */
  stock: number
}

export type CartView = {
  lines: CartLine[]
  subtotal: number
  count: number
  /**
   * True when a line was silently corrected on this read — capped to less
   * stock than the cookie asked for, or dropped because the variant (or its
   * product) is no longer active. The page renders a notice; the *next*
   * mutation persists the correction, because `getCart()` itself cannot write
   * a cookie (see `lib/cart.ts`).
   */
  adjusted: boolean
}

export type CartMutationResult =
  | { ok: true; count: number }
  | { ok: false; message: string }

const EMPTY_CART: CartView = { lines: [], subtotal: 0, count: 0, adjusted: false }

/* -------------------------------------------------------------------------
 * Reads
 * ---------------------------------------------------------------------- */

/**
 * The cart, resolved against the database.
 *
 * Order follows the cookie's own order — the order things were added in —
 * rather than a database sort, because that is the order a shopper expects
 * to still see their cart in.
 */
export async function getCart(): Promise<CartView> {
  const cookie = await readCartCookie()
  if (cookie.length === 0) return EMPTY_CART

  const variants = await db.productVariant.findMany({
    where: {
      id: { in: cookie.map((line) => line.v) },
      isActive: true,
      product: { isActive: true },
    },
    select: {
      id: true,
      price: true,
      stock: true,
      bottleSize: true,
      oilWeight: true,
      oilGrade: true,
      product: {
        select: {
          name: true,
          slug: true,
          productType: true,
          images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  })

  const byId = new Map(variants.map((variant) => [variant.id, variant]))

  let adjusted = false
  const lines: CartLine[] = []

  for (const entry of cookie) {
    const variant = byId.get(entry.v)

    // Retired, hidden, or deleted since it was added.
    if (!variant) {
      adjusted = true
      continue
    }

    const quantity = Math.min(entry.q, variant.stock, MAX_LINE_QUANTITY)

    // Stock dropped to zero (or below what was in the cart) since it was added.
    if (quantity <= 0) {
      adjusted = true
      continue
    }
    if (quantity !== entry.q) adjusted = true

    const unitPrice = variant.price.toNumber()

    lines.push({
      variantId: variant.id,
      productSlug: variant.product.slug,
      productName: variant.product.name,
      label: formatVariantLabel({
        productType: variant.product.productType,
        bottleSize: variant.bottleSize,
        oilWeight: variant.oilWeight,
      }),
      oilGrade: variant.oilGrade,
      imageUrl: variant.product.images[0]?.url ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      stock: variant.stock,
    })
  }

  return {
    lines,
    subtotal: lines.reduce((total, line) => total + line.lineTotal, 0),
    count: lines.reduce((total, line) => total + line.quantity, 0),
    adjusted,
  }
}

/**
 * The number badge on the cart icon, on every storefront page.
 *
 * Deliberately cheap: it sums the cookie's own quantities and never touches
 * the database, so it costs nothing extra on every page load. That means it
 * can be briefly wrong — a variant retired since it was added still counts
 * here — and `getCart()` on the cart page itself is what corrects it. A badge
 * a shopper glances at is not the place to spend a query proving it exactly
 * right.
 */
export async function getCartCount(): Promise<number> {
  const cookie = await readCartCookie()
  return cookie.reduce((total, line) => total + line.q, 0)
}

/* -------------------------------------------------------------------------
 * Writes
 * ---------------------------------------------------------------------- */

/**
 * Add `quantity` of one variant, on top of whatever is already in the cart.
 *
 * Refuses before touching the cookie when the variant (or its product) is not
 * sellable, or has no stock at all — the same sellability gate
 * `catalog.service.ts` applies to the storefront. Clamped to the variant's
 * *current* stock and to `MAX_LINE_QUANTITY`, the same ceiling the quantity
 * steppers enforce on the client.
 */
export async function addToCart(
  variantId: string,
  quantity: number
): Promise<CartMutationResult> {
  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { isActive: true, stock: true, product: { select: { isActive: true } } },
  })

  if (!variant || !variant.isActive || !variant.product.isActive) {
    return { ok: false, message: "هذا الخيار لم يعد متاحًا." }
  }
  if (variant.stock <= 0) {
    return { ok: false, message: "نفد المخزون لهذا الخيار." }
  }

  const cookie = await readCartCookie()
  const existing = cookie.find((line) => line.v === variantId)
  const nextQuantity = Math.min(
    (existing?.q ?? 0) + quantity,
    variant.stock,
    MAX_LINE_QUANTITY
  )

  let next: CartCookie

  if (existing) {
    next = cookie.map((line) =>
      line.v === variantId ? { v: variantId, q: nextQuantity } : line
    )
  } else {
    if (cookie.length >= MAX_CART_LINES) {
      return { ok: false, message: "السلة ممتلئة — أزل عنصرًا لإضافة آخر." }
    }
    next = [...cookie, { v: variantId, q: nextQuantity }]
  }

  await writeCartCookie(next)
  return { ok: true, count: cartCount(next) }
}

/**
 * Set one line to an exact quantity — the stepper's +/- and the cart page's
 * "0 means remove" both go through here. `updateCartItem` rather than two
 * separate `increment` / `decrement` calls: the stepper already knows the
 * target number, and one call is one place the clamp can happen.
 */
export async function updateCartItem(
  variantId: string,
  quantity: number
): Promise<CartMutationResult> {
  if (quantity <= 0) return removeCartItem(variantId)

  const cookie = await readCartCookie()
  if (!cookie.some((line) => line.v === variantId)) {
    return { ok: false, message: "هذا الخيار لم يعد في السلة." }
  }

  const variant = await db.productVariant.findUnique({
    where: { id: variantId },
    select: { isActive: true, stock: true },
  })

  if (!variant || !variant.isActive) {
    const next = cookie.filter((line) => line.v !== variantId)
    await writeCartCookie(next)
    return { ok: false, message: "هذا الخيار لم يعد متاحًا، وأُزيل من السلة." }
  }

  const clamped = Math.min(quantity, variant.stock, MAX_LINE_QUANTITY)
  const next = cookie.map((line) =>
    line.v === variantId ? { v: variantId, q: clamped } : line
  )

  await writeCartCookie(next)
  return { ok: true, count: cartCount(next) }
}

export async function removeCartItem(
  variantId: string
): Promise<CartMutationResult> {
  const cookie = await readCartCookie()
  const next = cookie.filter((line) => line.v !== variantId)

  await writeCartCookie(next)
  return { ok: true, count: cartCount(next) }
}

export async function clearCart(): Promise<CartMutationResult> {
  await writeCartCookie([])
  return { ok: true, count: 0 }
}

function cartCount(lines: CartCookie): number {
  return lines.reduce((total, line) => total + line.q, 0)
}
