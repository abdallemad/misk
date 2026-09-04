"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import { clearCart, type CartMutationResult } from "@/services/cart.service"

/** Empty the cart in one go — the cart page's "إفراغ السلة". */
export async function clearCartAction(): Promise<CartMutationResult> {
  const result = await clearCart()

  revalidatePath(ROUTES.cart)
  revalidatePath("/", "layout")

  return result
}
