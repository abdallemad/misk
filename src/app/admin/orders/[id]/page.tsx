import { notFound } from "next/navigation"
import Link from "next/link"
import { MapPinIcon, UserIcon } from "lucide-react"

import { BreadcrumbTitle } from "@/components/admin/layout"
import {
  OrderStatusControl,
  OrderSummary,
} from "@/components/admin/orders"
import { PageContainer, PageHeader, SectionCard } from "@/components/admin/shared"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { adminCustomerRoute } from "@/constants/routes"
import { getOrder } from "@/services/order.service"
import { formatDate } from "@/utils/format"

export const metadata = { title: "تفاصيل الطلب" }

/**
 * `/admin/orders/[id]` — one order: its status, its shipping address, the
 * customer, and the line items.
 *
 * A real route, not a dialog, for the reason a product and a customer get
 * one: there is enough here to be worth a URL, and the status control needs
 * room. `notFound()` on a missing row — a stale link is a 404.
 */
export default async function OrderDetailPage(
  props: PageProps<"/admin/orders/[id]">
) {
  const { id } = await props.params
  const order = await getOrder(id)

  if (!order) notFound()

  const shortId = order.id.slice(-6).toUpperCase()
  const customerName = order.customer.name || "عميل بدون اسم"

  return (
    <PageContainer>
      <BreadcrumbTitle title={`#${shortId}`} />
      <PageHeader
        title={`الطلب #${shortId}`}
        description={`أُنشئ في ${formatDate(order.createdAt)}.`}
      />

      <SectionCard
        title="الحالة"
        description="حرّك الطلب على مسار التنفيذ. لا يؤثر ذلك على المخزون أو الدفع."
      >
        <OrderStatusControl orderId={order.id} currentStatus={order.status} />
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="العميل">
          <div className="flex items-start gap-3">
            <Avatar size="default">
              {order.customer.imageUrl ? (
                <AvatarImage src={order.customer.imageUrl} alt="" />
              ) : null}
              <AvatarFallback>
                {(order.customer.name?.trim() || order.customer.email)
                  .charAt(0)
                  .toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex min-w-0 flex-col gap-1 text-sm">
              <Link
                href={adminCustomerRoute(order.customer.id)}
                className="font-medium underline-offset-4 hover:underline"
              >
                {customerName}
              </Link>
              <span className="text-muted-foreground" dir="ltr">
                {order.customer.email}
              </span>
              {order.customer.phone ? (
                <span className="text-muted-foreground" dir="ltr">
                  {order.customer.phone}
                </span>
              ) : null}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="ms-auto"
              render={<Link href={adminCustomerRoute(order.customer.id)} />}
            >
              <UserIcon aria-hidden="true" />
              الملف
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="عنوان الشحن">
          {order.shipping ? (
            <address className="flex flex-col gap-1 text-sm not-italic">
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
              {order.shipping.country ? (
                <span className="text-muted-foreground">
                  {countryLabel(order.shipping.country)}
                </span>
              ) : null}
              {order.shipping.phone ? (
                <span className="text-muted-foreground" dir="ltr">
                  {order.shipping.phone}
                </span>
              ) : null}
              {order.shipping.phone2 ? (
                <span className="text-muted-foreground" dir="ltr">
                  {order.shipping.phone2}
                  <span className="text-xs"> (هاتف إضافي)</span>
                </span>
              ) : null}
            </address>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPinIcon className="size-4" aria-hidden="true" />
              لا يوجد عنوان شحن على هذا الطلب.
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="محتويات الطلب" flush>
        <OrderSummary items={order.items} totalPrice={order.totalPrice} />
      </SectionCard>
    </PageContainer>
  )
}

/** The one country the shop ships to today; other codes fall through as-is. */
function countryLabel(code: string): string {
  return code === "EG" ? "مصر" : code
}
