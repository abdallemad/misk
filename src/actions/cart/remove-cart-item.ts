"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { removeCartItem, type CartMutationResult } from "@/services/cart.service"

/** Remove one line from the cart entirely — the cart page's trash button. */
export async function removeCartItemAction(
  variantId: string
): Promise<CartMutationResult> {
  if (typeof variantId !== "string" || variantId === "") {
    return { ok: false, message: "طلب غير صالح." }
  }

  const result = await removeCartItem(variantId)

  if (result.ok) {
    revalidatePath(ROUTES.cart)
    revalidatePath("/", "layout")
  }

  return result
}
