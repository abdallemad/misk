"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { updateOrderStatusAction } from "@/actions/order/update-order-status"
import { OrderStatusBadge } from "@/components/admin/shared"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  type OrderStatus,
} from "@/constants/design-system"

type OrderStatusControlProps = {
  orderId: string
  currentStatus: OrderStatus
}

/**
 * The one write on the orders console: move an order along the fulfilment
 * track.
 *
 * A `<Select>` rather than a row of buttons — six statuses is too many for
 * buttons, and the current value should be visible at rest. The change is
 * dispatched straight through (no confirm dialog): unlike promoting a
 * customer to admin, a wrong status is fixed by picking again, and the toast
 * says what happened.
 *
 * `useTransition` keeps the control disabled and spinning while the action
 * runs; the action revalidates the page, so the badge beside it and the row
 * in the list refresh on the next paint.
 */
export function OrderStatusControl({
  orderId,
  currentStatus,
}: OrderStatusControlProps) {
  const [pending, startTransition] = useTransition()

  const statusItems = ORDER_STATUSES.map((value) => ({
    value,
    label: ORDER_STATUS_LABEL[value],
  }))

  function onChange(next: OrderStatus) {
    if (next === currentStatus) return

    startTransition(async () => {
      const result = await updateOrderStatusAction(orderId, next)

      if (result.ok) {
        toast.success(`تم تحديث الحالة إلى «${ORDER_STATUS_LABEL[next]}».`)
        return
      }

      toast.error(result.message)
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <OrderStatusBadge status={currentStatus} />

      <div className="flex items-center gap-2">
        <Select
          items={statusItems}
          value={currentStatus}
          onValueChange={(value) => onChange(value as OrderStatus)}
          disabled={pending}
        >
          <SelectTrigger size="sm" aria-label="تغيير حالة الطلب">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusItems.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {pending ? <Spinner /> : null}
      </div>
    </div>
  )
}
