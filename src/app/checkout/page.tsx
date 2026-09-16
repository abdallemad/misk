import { redirect } from "next/navigation"

import { CheckoutForm } from "@/components/checkout/checkout-form"
import { CheckoutSummary } from "@/components/checkout/checkout-summary"
import { ROUTES } from "@/constants/routes"
import { getCart } from "@/services/cart.service"
import { getCurrentUser } from "@/services/auth.service"

export const metadata = { title: "إتمام الطلب" }

/**
 * `/checkout` — the information collector between `/cart` and a placed
 * order: phone numbers and address, then "تأكيد الطلب".
 *
 * Behind `checkout/layout.tsx`'s `auth.protect()` — an `Order` needs a `User`
 * row, and `syncCurrentUser()` only ever runs on `/auth-callback`. The
 * `getCurrentUser()` check here is a defensive second layer, the same
 * belt-and-braces `placeOrderAction` repeats for the write itself; it should
 * never actually fire given the layout guard, and falls back to `/sign-in`
 * if it somehow does.
 *
 * An empty cart has nothing to check out, so it redirects to `/cart` rather
 * than rendering a form with nothing above it.
 *
 * See docs/checkout-orders-feature.md.
 */
export default async function CheckoutPage() {
  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.signIn)

  const cart = await getCart()
  if (cart.lines.length === 0) redirect(ROUTES.cart)

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <header>
        <p className="eyebrow">الخطوة الأخيرة</p>
        <h1 className="mt-2 text-display-md sm:text-display-lg">
          إتمام الطلب
        </h1>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          أدخل بيانات التواصل والعنوان — الدفع عند الاستلام، بلا حاجة لبطاقة
          الآن.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <CheckoutForm />
        <CheckoutSummary cart={cart} />
      </div>
    </div>
  )
}
