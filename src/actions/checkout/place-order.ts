"use server"

import { revalidatePath } from "next/cache"

import { ROUTES } from "@/constants/routes"
import {
  parseCheckoutForm,
  type CheckoutFormState,
} from "@/schemas/checkout.schema"
import { getCurrentUser } from "@/services/auth.service"
import { createOrder } from "@/services/order.service"

/**
 * Place a cash-on-delivery order from the current cart.
 *
 * `/checkout` sits behind the proxy's session gate (`proxy.ts`), but a Server
 * Action is a POST endpoint a request can in principle reach without ever
 * rendering that page, so `getCurrentUser()` is re-checked here — the same
 * belt-and-braces every admin action takes with `isAdmin()`, and the reason
 * is identical: the page-level guard does not run for the action itself.
 *
 * Shaped for `useActionState`: takes the previous state, returns the next,
 * never throws. The client half is
 * `components/checkout/checkout-form.tsx`.
 *
 * `CheckoutFormState` and its idle value are imported from the schema rather
 * than declared here — a `"use server"` module may export only async
 * functions. See docs/checkout-orders-feature.md.
 */
export async function placeOrderAction(
  _previous: CheckoutFormState,
  formData: FormData
): Promise<CheckoutFormState> {
  const user = await getCurrentUser()

  if (!user) {
    return {
      status: "error",
      message: "يجب تسجيل الدخول لإتمام الطلب.",
      errors: {},
      orderId: null,
    }
  }

  const parsed = parseCheckoutForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "راجع الحقول المميّزة بالأحمر.",
      errors: parsed.errors,
      orderId: null,
    }
  }

  const result = await createOrder(user.id, parsed.data)

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      errors: {},
      orderId: null,
    }
  }

  // The cart is now empty (createOrder cleared it), the new order needs to
  // show up in the shopper's history, and the header's cart badge — anywhere
  // in the storefront shell — needs to drop to zero.
  revalidatePath(ROUTES.cart)
  revalidatePath(ROUTES.accountOrders)
  revalidatePath("/", "layout")

  return {
    status: "success",
    message: "تم استلام طلبك — الدفع عند الاستلام.",
    errors: {},
    orderId: result.orderId,
  }
}
