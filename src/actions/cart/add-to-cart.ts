"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { addToCartInputSchema } from "@/schemas/cart.schema"
import { addToCart, type CartMutationResult } from "@/services/cart.service"

/**
 * Add a variant to the cart — called directly from a client control (the
 * product page's `AddToCartForm`, or a catalogue card's quick-add), the same
 * plain-arguments shape `updateOrderStatusAction` and `deleteProductAction`
 * use rather than `useActionState` + `FormData`: there is no form here, only
 * a button.
 *
 * Public — no `isAdmin()` check, unlike every admin action. The schema is
 * still the actual gate: this is a POST endpoint reachable directly, and
 * `addToCartInputSchema` is what stops a hand-crafted call from asking for a
 * quantity above `MAX_LINE_QUANTITY`. See docs/cart-feature.md.
 */
export async function addToCartAction(
  input: unknown
): Promise<CartMutationResult> {
  const parsed = addToCartInputSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: "طلب غير صالح." }

  const result = await addToCart(parsed.data.variantId, parsed.data.quantity)

  if (result.ok) {
    // The cart page, and the cart-count badge everywhere else in the
    // storefront shell — see docs/cart-feature.md for why a full layout
    // revalidation is the right amount of force for a low-frequency write.
    revalidatePath(ROUTES.cart)
    revalidatePath("/", "layout")
  }

  return result
}
