import Link from "next/link"
import { ReceiptTextIcon } from "lucide-react"

import { OrderStatusBadge } from "@/components/shared"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { accountOrderRoute, ROUTES } from "@/constants/routes"
import { buttonVariants } from "@/components/ui/button"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import type { MyOrderRow } from "@/services/order.service"

/**
 * A shopper's own order history — `/account/orders`.
 *
 * The customer-facing twin of the admin `OrdersTable`: same columns, minus
 * the customer column (every row here is already "me"), and each row links
 * to `accountOrderRoute` instead of `adminOrderRoute`. A Server Component —
 * nothing on this list is interactive.
 *
 * **The whole row is the click target**, not just the `#ABC123` text — the
 * "stretched link" pattern: a `<Link>` positioned `absolute inset-0` inside
 * the first cell, sized against the row by `<TableRow>`'s own `relative`
 * (added here, not on the shared primitive, so no other table gains it).
 * The mono `#ABC123` stays as a visible sibling `<span>` — real link text for
 * anyone tabbing through or reading with a screen reader, `aria-hidden` so
 * the same string is not announced twice. The admin `OrdersTable` instead
 * gives each row a dedicated eye-icon button; this table has more room to
 * make the row itself the target since nothing else in it is interactive.
 */
export function AccountOrdersTable({ orders }: { orders: MyOrderRow[] }) {
  if (orders.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>لا توجد طلبات بعد</EmptyTitle>
          <EmptyDescription>
            طلباتك تظهر هنا فور تأكيدها من صفحة السلة.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={ROUTES.store} className={buttonVariants({ variant: "gold" })}>
          تصفّح المتجر
        </Link>
      </Empty>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>الطلب</TableHead>
          <TableHead className="hidden sm:table-cell">التاريخ</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead className="text-center">القطع</TableHead>
          <TableHead>الإجمالي</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id} className="relative cursor-pointer">
            <TableCell>
              <Link
                href={accountOrderRoute(order.id)}
                className="absolute inset-0"
                aria-label={`عرض الطلب #${shortId(order.id)}`}
              />
              <span
                className="relative font-mono text-xs font-medium"
                aria-hidden="true"
                dir="ltr"
              >
                #{shortId(order.id)}
              </span>
            </TableCell>

            <TableCell className="hidden sm:table-cell">
              <span className="whitespace-nowrap text-muted-foreground">
                {formatDate(order.createdAt)}
              </span>
            </TableCell>

            <TableCell>
              <OrderStatusBadge status={order.status} />
            </TableCell>

            <TableCell className="text-center">
              <span data-numeric className="tabular-nums">
                {formatNumber(order.itemCount)}
              </span>
            </TableCell>

            <TableCell>
              <span data-numeric className="tabular-nums whitespace-nowrap">
                {formatPrice(order.totalPrice)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Last 6 characters of the cuid, upper-cased — same handle the admin console
 *  prints, so an order is the same `#ABC123` wherever it is shown. */
function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}
