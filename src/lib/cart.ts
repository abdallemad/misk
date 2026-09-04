import "server-only"

import { cookies } from "next/headers"

import {
  parseCartCookie,
  serializeCartCookie,
  type CartCookie,
} from "@/schemas/cart.schema"

/**
 * The cart cookie — read and write, and nothing else.
 *
 * See docs/cart-feature.md for why the cart is a cookie rather than a `Cart`
 * table: no schema change, no anonymous-cart-to-account merge to build, and
 * it works the moment a shopper lands on the site, signed in or not.
 *
 * `server-only` because `next/headers` only works in a Server Component or a
 * Server Action — `writeCartCookie` throws if called from the former, which
 * is exactly the constraint `services/cart.service.ts` is built around: reads
 * happen anywhere, writes happen only inside an action.
 */

const CART_COOKIE_NAME = "misk_cart"

/** 30 days — long enough that leaving to compare prices does not empty the cart. */
const CART_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function readCartCookie(): Promise<CartCookie> {
  const store = await cookies()
  return parseCartCookie(store.get(CART_COOKIE_NAME)?.value)
}

/** An empty cart deletes the cookie rather than storing `"[]"`. */
export async function writeCartCookie(lines: CartCookie): Promise<void> {
  const store = await cookies()

  if (lines.length === 0) {
    store.delete(CART_COOKIE_NAME)
    return
  }

  store.set(CART_COOKIE_NAME, serializeCartCookie(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: CART_COOKIE_MAX_AGE,
  })
}
