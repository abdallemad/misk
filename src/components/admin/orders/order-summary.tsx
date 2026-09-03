import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNumber, formatPrice } from "@/utils/format"
import type { OrderLineRow } from "@/services/order.service"

type OrderSummaryProps = {
  items: OrderLineRow[]
  totalPrice: number
}

/**
 * The line items on an order, with a totals row.
 *
 * A Server Component — nothing here changes. Each line shows the perfume, the
 * variant label, the SKU (printed on the bottle and quoted in the customer's
 * confirmation), the unit price snapshotted at checkout, and the line total.
 *
 * The footer total is the order's stored `totalPrice`, not a re-sum of the
 * lines: if they ever disagree, the stored figure is what the customer was
 * actually charged and the one to trust.
 */
export function OrderSummary({ items, totalPrice }: OrderSummaryProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المنتج</TableHead>
          <TableHead className="hidden sm:table-cell">الرمز</TableHead>
          <TableHead className="text-center">الكمية</TableHead>
          <TableHead>سعر الوحدة</TableHead>
          <TableHead>الإجمالي</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium">{item.productName}</span>
                <span className="text-xs text-muted-foreground">
                  {item.variantLabel}
                </span>
              </div>
            </TableCell>

            <TableCell className="hidden sm:table-cell">
              <code className="font-mono text-xs text-muted-foreground" dir="ltr">
                {item.sku}
              </code>
            </TableCell>

            <TableCell className="text-center">
              <span data-numeric className="tabular-nums">
                {formatNumber(item.quantity)}
              </span>
            </TableCell>

            <TableCell>
              <span data-numeric className="tabular-nums whitespace-nowrap">
                {formatPrice(item.unitPrice)}
              </span>
            </TableCell>

            <TableCell>
              <span data-numeric className="tabular-nums whitespace-nowrap">
                {formatPrice(item.lineTotal)}
              </span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>

      <TableFooter>
        <TableRow>
          <TableCell colSpan={4} className="text-start font-medium">
            الإجمالي
          </TableCell>
          <TableCell>
            <span
              data-numeric
              className="tabular-nums font-semibold whitespace-nowrap"
            >
              {formatPrice(totalPrice)}
            </span>
          </TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  )
}
