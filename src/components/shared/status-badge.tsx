import { Badge } from "@/components/ui/badge"
import {
  ORDER_STATUS_LABEL,
  ORDER_STATUS_TONE,
  STOCK_LABEL,
  STOCK_TONE,
  TONE_SOFT_CLASS,
  stockLevel,
  type OrderStatus,
  type Tone,
} from "@/constants/design-system"
import { cn } from "@/lib/utils"

type StatusBadgeProps = {
  tone?: Tone
  className?: string
  children: React.ReactNode
}

/**
 * One badge for every status in the app — order state in the admin table,
 * stock state on a product card. The tone is looked up from
 * `@/constants/design-system`, never chosen at the call site, so the same
 * status is the same colour everywhere.
 */
function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  return (
    <Badge className={cn(TONE_SOFT_CLASS[tone], className)}>{children}</Badge>
  )
}

function OrderStatusBadge({
  status,
  className,
}: {
  status: OrderStatus
  className?: string
}) {
  return (
    <StatusBadge tone={ORDER_STATUS_TONE[status]} className={className}>
      {ORDER_STATUS_LABEL[status]}
    </StatusBadge>
  )
}

function StockBadge({
  stock,
  className,
}: {
  stock: number
  className?: string
}) {
  const level = stockLevel(stock)

  return (
    <StatusBadge tone={STOCK_TONE[level]} className={className}>
      {STOCK_LABEL[level]}
    </StatusBadge>
  )
}

export { StatusBadge, OrderStatusBadge, StockBadge }
