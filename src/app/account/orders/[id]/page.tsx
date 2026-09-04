import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { MapPinIcon } from "lucide-react"

import { OrderStatusBadge, OrderSummary } from "@/components/shared"
import { buttonVariants } from "@/components/ui/button"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { getCurrentUser } from "@/services/auth.service"
import { getOrderForUser } from "@/services/order.service"
import { formatDate } from "@/utils/format"

export const metadata = { title: "تفاصيل الطلب" }

/**
 * `/account/orders/[id]` — one of the shopper's own orders: its status, the
 * address it is shipping to, and its line items.
 *
 * The customer-facing twin of `/admin/orders/[id]`, minus the one thing that
 * page has and this one must not: a way to change the status. `getOrderForUser`
 * is what makes that safe rather than a UI omission someone could route
 * around — the query itself is scoped to `userId`, so a guessed id belonging
 * to someone else 404s exactly like one that does not exist. See
 * docs/checkout-orders-feature.md.
 */
export default async function AccountOrderDetailPage(
  props: PageProps<"/account/orders/[id]">
) {
  const { id } = await props.params

  const user = await getCurrentUser()
  if (!user) redirect(ROUTES.signIn)

  const order = await getOrderForUser(user.id, id)
  if (!order) notFound()

  const shortId = order.id.slice(-6).toUpperCase()

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <nav
        aria-label="مسار التنقّل"
        className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
      >
        <Link href={ROUTES.accountOrders} className="hover:text-foreground">
          طلباتي
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-foreground" dir="ltr">
          #{shortId}
        </span>
      </nav>

      <header className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-display-md sm:text-display-lg" dir="ltr">
            #{shortId}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            أُنشئ في {formatDate(order.createdAt)} — الدفع عند الاستلام.
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">عنوان الشحن وبيانات التواصل</h2>
          {order.shipping ? (
            <address className="mt-2 flex flex-col gap-1 text-sm not-italic">
              {order.shipping.name ? (
                <span className="font-medium">{order.shipping.name}</span>
              ) : null}
              <span>{order.shipping.line1}</span>
              {order.shipping.line2 ? <span>{order.shipping.line2}</span> : null}
              <span className="text-muted-foreground">
                {[order.shipping.city, order.shipping.governorate]
                  .filter(Boolean)
                  .join("، ")}
              </span>
              {order.shipping.phone ? (
                <span className="text-muted-foreground" dir="ltr">
                  {order.shipping.phone}
                </span>
              ) : null}
              {order.shipping.phone2 ? (
                <span className="text-muted-foreground" dir="ltr">
                  {order.shipping.phone2}
                </span>
              ) : null}
            </address>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" aria-hidden="true" />
              لا يوجد عنوان مسجّل على هذا الطلب.
            </div>
          )}
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-border">
        <OrderSummary items={order.items} totalPrice={order.totalPrice} />
      </section>

      <Link
        href={ROUTES.accountOrders}
        className={cn(buttonVariants({ variant: "outline" }), "mt-6")}
      >
        كل طلباتي
      </Link>
    </div>
  )
}
