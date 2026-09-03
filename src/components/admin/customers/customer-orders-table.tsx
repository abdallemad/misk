import { OrderStatusBadge } from "@/components/admin/shared"
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
import { ReceiptTextIcon } from "lucide-react"

import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import type { CustomerOrderRow } from "@/services/customer.service"

type CustomerOrdersTableProps = {
  orders: CustomerOrderRow[]
}

/**
 * One customer's order history.
 *
 * A Server Component — read-only, like the rest of this feature. Each row is
 * one order: its short id, when it was placed, its status, and its total,
 * with the line items listed underneath so the admin can see *what* was
 * ordered without opening a separate page (there is no order detail route
 * yet — that is `orders-feature.md`).
 *
 * The status badge's tone and label come from `@/constants/design-system`,
 * never from here, so an order that is «قيد التحضير» is the same colour on
 * this table and on the orders console when it is built.
 *
 * See docs/customers-feature.md.
 */
export function CustomerOrdersTable({ orders }: CustomerOrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>لا توجد طلبات</EmptyTitle>
          <EmptyDescription>
            لم يُكمل هذا العميل أي طلب بعد.
          </EmptyDescription>
        </EmptyHeader>
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
          <TableRow key={order.id} className="align-top">
            <TableCell>
              <div className="flex flex-col gap-1">
                <code className="font-mono text-xs text-muted-foreground" dir="ltr">
                  #{shortId(order.id)}
                </code>
                <ul className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                  {order.items.map((item) => (
                    <li key={item.id}>
                      <span className="text-foreground">{item.productName}</span>
                      {" · "}
                      {item.variantLabel}
                      {" × "}
                      <span data-numeric className="tabular-nums">
                        {formatNumber(item.quantity)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
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

/** Last 6 characters of a cuid — enough to tell two of this customer's orders
 *  apart in conversation, without printing a 25-character id in the table. */
function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}
