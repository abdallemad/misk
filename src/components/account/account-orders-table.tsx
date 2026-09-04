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
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={accountOrderRoute(order.id)}
                className="font-mono text-xs font-medium underline-offset-4 hover:underline"
                dir="ltr"
              >
                #{shortId(order.id)}
              </Link>
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
