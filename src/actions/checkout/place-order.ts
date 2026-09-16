"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { accountOrderRoute, ROUTES } from "@/constants/routes"
import {
  parseCheckoutForm,
  type CheckoutFormState,
} from "@/schemas/checkout.schema"
import { getCurrentUser } from "@/services/auth.service"
import { createOrder } from "@/services/order.service"

/**
 * Place a cash-on-delivery order from the current cart.
 *
 * `/checkout` sits behind `checkout/layout.tsx`'s `auth.protect()`, but a
 * Server Action is a POST endpoint a request can in principle reach without
 * ever rendering that layout, so `getCurrentUser()` is re-checked here — the
 * same belt-and-braces every admin action takes with `isAdmin()`, and the
 * reason is identical: the layout guard does not run for the action itself.
 *
 * Shaped for `useActionState`: takes the previous state, returns the next,
 * never throws *for an error* — an error is a returned state, same as every
 * other form in this project.
 *
 * **Redirects on success, from inside the action — not the return-state-and-
 * let-the-client-navigate pattern this file (and `product-form.tsx`) used to
 * follow.** That pattern raced `/checkout/page.tsx`'s own guard: the page
 * redirects to `/cart` whenever the cart is empty, and `createOrder`'s last
 * step is clearing the cart. Returning a `"success"` state and letting a
 * `useEffect` call `router.push(accountOrderRoute(orderId))` left a window
 * where Next.js's automatic refresh of the *current* route (`/checkout`,
 * triggered by having just run a Server Action against it) re-ran that page
 * first — cart now empty, so *it* redirected to `/cart` before the client's
 * own effect ever fired, and the shopper landed back on the cart instead of
 * their new order. Calling `redirect()` here instead means the framework
 * navigates straight to the order from the action's own response; the
 * `/checkout` page never renders again to see the empty cart. See
 * docs/checkout-orders-feature.md.
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
    }
  }

  const parsed = parseCheckoutForm(formData)

  if (!parsed.success) {
    return {
      status: "error",
      message: "راجع الحقول المميّزة بالأحمر.",
      errors: parsed.errors,
    }
  }

  const result = await createOrder(user.id, parsed.data)

  if (!result.ok) {
    return {
      status: "error",
      message: result.message,
      errors: {},
    }
  }

  // The cart is now empty (createOrder cleared it), the new order needs to
  // show up in the shopper's history, and the header's cart badge — anywhere
  // in the storefront shell — needs to drop to zero.
  revalidatePath(ROUTES.cart)
  revalidatePath(ROUTES.accountOrders)
  revalidatePath("/", "layout")

  redirect(accountOrderRoute(result.orderId))
}
