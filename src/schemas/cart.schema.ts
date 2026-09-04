import { z } from "zod"

import { MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/constants/cart"

/**
 * The cart's isomorphic half — the cookie's shape, and the two mutation
 * payloads a client control sends.
 *
 * There is no `Cart` / `CartItem` table (see docs/cart-feature.md for why):
 * the cart lives in a cookie, `{ v: variantId, q: quantity }` per line, kept
 * deliberately small. Nothing here touches `services/`, `lib/db.ts` or
 * anything `server-only` — the same rule `product.schema.ts` and
 * `category.schema.ts` follow, so this file could in principle run in the
 * browser too, even though nothing does today.
 */

const cartCookieLineSchema = z.object({
  /** A `ProductVariant.id` — whether it still exists is the service's question. */
  v: z.string().min(1),
  q: z.number().int().min(1).max(MAX_LINE_QUANTITY),
})

export const cartCookieSchema = z
  .array(cartCookieLineSchema)
  .max(MAX_CART_LINES)

export type CartCookieLine = z.infer<typeof cartCookieLineSchema>
export type CartCookie = CartCookieLine[]

/**
 * Parse the cookie's raw string. Never throws: a cookie is user-controlled
 * (a hand-edited value, a stale shape from an earlier version of this file),
 * so anything that does not parse or does not validate is read as an empty
 * cart rather than a crash.
 */
export function parseCartCookie(raw: string | undefined): CartCookie {
  if (!raw) return []

  try {
    const result = cartCookieSchema.safeParse(JSON.parse(raw))
    return result.success ? result.data : []
  } catch {
    return []
  }
}

export function serializeCartCookie(lines: CartCookie): string {
  return JSON.stringify(lines)
}

/* -------------------------------------------------------------------------
 * Mutation payloads
 *
 * Both actions take a plain object rather than `FormData` — there is no form
 * here, just a button or a stepper dispatching a Server Action directly, the
 * same shape `updateOrderStatusAction` and `deleteProductAction` use. Each
 * action is still a public POST endpoint, so the schema is still the gate:
 * a hand-crafted call with a `quantity` of `1e9` or a `variantId` that is not
 * a string is rejected here, before the service ever runs a query.
 * ---------------------------------------------------------------------- */

/** Adding always adds at least one unit. */
export const addToCartInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
})

export type AddToCartInput = z.infer<typeof addToCartInputSchema>

/** Setting a line to a quantity — `0` is how the stepper asks for removal. */
export const updateCartItemInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(0).max(MAX_LINE_QUANTITY),
})

export type UpdateCartItemInput = z.infer<typeof updateCartItemInputSchema>
