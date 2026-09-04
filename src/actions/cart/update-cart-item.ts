"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { updateCartItemInputSchema } from "@/schemas/cart.schema"
import { updateCartItem, type CartMutationResult } from "@/services/cart.service"

/**
 * Set one cart line's quantity — the stepper's +/- on the cart page. A
 * `quantity` of `0` is a removal; the service treats it as one.
 *
 * See `add-to-cart.ts` for why this is a plain async function rather than
 * `useActionState`, and why there is no `isAdmin()` check here.
 */
export async function updateCartItemAction(
  variantId: string,
  quantity: number
): Promise<CartMutationResult> {
  const parsed = updateCartItemInputSchema.safeParse({ variantId, quantity })
  if (!parsed.success) return { ok: false, message: "طلب غير صالح." }

  const result = await updateCartItem(parsed.data.variantId, parsed.data.quantity)

  if (result.ok) {
    revalidatePath(ROUTES.cart)
    revalidatePath("/", "layout")
  }

  return result
}
