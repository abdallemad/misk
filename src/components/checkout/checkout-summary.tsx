import Image from "next/image"

import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import { formatPrice } from "@/utils/format"
import type { CartView } from "@/services/cart.service"

/**
 * A read-only echo of the cart on `/checkout` — what is about to be ordered,
 * and the total. Editing a quantity or removing a line is `/cart`'s job, not
 * this page's; by the time a shopper is here they are confirming, not
 * shopping, so the list has no stepper and no remove button.
 */
export function CheckoutSummary({ cart }: { cart: CartView }) {
  return (
    <div className="rounded-xl border border-border">
      <ul className="divide-y divide-border">
        {cart.lines.map((line) => (
          <li key={line.variantId} className="flex items-center gap-3 p-3">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
              <Image
                src={line.imageUrl ?? DEFAULT_PRODUCT_IMAGE}
                alt={line.productName}
                fill
                sizes="48px"
                className="object-cover"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{line.productName}</p>
              <p className="text-xs text-muted-foreground">
                {line.label}
                {line.oilGrade ? ` · ${line.oilGrade}` : ""}
                {" × "}
                <span data-numeric>{line.quantity}</span>
              </p>
            </div>

            <span className="shrink-0 text-sm font-medium tabular-nums" data-numeric>
              {formatPrice(line.lineTotal)}
            </span>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border p-3 text-base font-medium">
        <span>الإجمالي</span>
        <span data-numeric>{formatPrice(cart.subtotal)}</span>
      </div>
    </div>
  )
}
