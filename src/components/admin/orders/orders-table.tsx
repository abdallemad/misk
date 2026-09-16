import Link from "next/link"
import { EyeIcon, ReceiptTextIcon } from "lucide-react"

import { OrderStatusBadge } from "@/components/admin/shared"
import { Button } from "@/components/ui/button"
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { adminCustomerRoute, adminOrderRoute } from "@/constants/routes"
import { formatDate, formatNumber, formatPrice } from "@/utils/format"
import type { OrderRow } from "@/services/order.service"

type OrdersTableProps = {
  orders: OrderRow[]
  /** A search or status filter is in effect. */
  filtered?: boolean
}

/**
 * The orders table.
 *
 * A Server Component — the only interactive thing about an order (its status)
 * lives on the detail page, so the list needs no client state. Rows are read
 * on the server and passed down, the same shape the products and customers
 * tables take.
 *
 * See docs/orders-feature.md.
 */
export function OrdersTable({ orders, filtered = false }: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Empty className="border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ReceiptTextIcon />
          </EmptyMedia>
          <EmptyTitle>
            {filtered ? "لا طلبات مطابقة" : "لا توجد طلبات بعد"}
          </EmptyTitle>
          <EmptyDescription>
            {filtered
              ? "غيّر كلمة البحث أو أزِل تصفية الحالة."
              : "تظهر الطلبات هنا فور إتمام أول عملية دفع في المتجر."}
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
          <TableHead>العميل</TableHead>
          <TableHead className="hidden md:table-cell">التاريخ</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead className="text-center">القطع</TableHead>
          <TableHead>الإجمالي</TableHead>
          <TableHead className="w-16">
            <span className="sr-only">إجراءات</span>
          </TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.id}>
            <TableCell>
              <Link
                href={adminOrderRoute(order.id)}
                className="font-mono text-xs font-medium underline-offset-4 hover:underline"
                dir="ltr"
              >
                #{shortId(order.id)}
              </Link>
            </TableCell>

            <TableCell>
              <div className="flex min-w-0 flex-col gap-0.5">
                <Link
                  href={adminCustomerRoute(order.customer.id)}
                  className="truncate font-medium underline-offset-4 hover:underline"
                >
                  {order.customer.name || "بدون اسم"}
                </Link>
                <span
                  className="truncate text-xs text-muted-foreground"
                  dir="ltr"
                >
                  {order.customer.email}
                </span>
              </div>
            </TableCell>

            <TableCell className="hidden md:table-cell">
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

            <TableCell>
              <div className="flex items-center justify-end">
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        nativeButton={false}
                        render={<Link href={adminOrderRoute(order.id)} />}
                      />
                    }
                  >
                    <EyeIcon aria-hidden="true" />
                    <span className="sr-only">
                      عرض الطلب #{shortId(order.id)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>عرض الطلب</TooltipContent>
                </Tooltip>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** Last 6 characters of the cuid, upper-cased — the handle the console uses
 *  for an order in a table and a heading. */
function shortId(id: string): string {
  return id.slice(-6).toUpperCase()
}
