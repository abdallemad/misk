import Link from "next/link"
import { ShoppingBagIcon } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { ROUTES } from "@/constants/routes"
import { cn } from "@/lib/utils"
import { formatNumber, formatPrice } from "@/utils/format"
import type { CartView } from "@/services/cart.service"

import { CartLineItem } from "./cart-line-item"
import { ClearCartButton } from "./clear-cart-button"

/**
 * The `/cart` page body — everything below the `<h1>`.
 *
 * A Server Component: it renders the lines the server already resolved
 * (`getCart()`), and every interactive bit (the stepper, remove, clear) is a
 * small client island underneath it. There is no cart-wide client state to
 * hold here.
 */
export function CartContent({ cart }: { cart: CartView }) {
  if (cart.lines.length === 0) {
    return (
      <Empty className="rounded-xl border border-dashed border-border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShoppingBagIcon />
          </EmptyMedia>
          <EmptyTitle>السلة فارغة</EmptyTitle>
          <EmptyDescription>
            لم تُضف أي عطور بعد. تصفّح المتجر واختر ما يناسبك.
          </EmptyDescription>
        </EmptyHeader>
        <Link href={ROUTES.store} className={buttonVariants({ variant: "gold" })}>
          تصفّح المتجر
        </Link>
      </Empty>
    )
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="flex flex-col gap-3">
        {cart.adjusted ? (
          <p className="rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">
            عدّلنا سلتك — أحد الخيارات لم يعد متوفرًا بنفس الكمية، أو لم يعد
            متوفرًا إطلاقًا.
          </p>
        ) : null}

        <ul className="flex flex-col divide-y divide-border rounded-xl border border-border">
          {cart.lines.map((line) => (
            <CartLineItem key={line.variantId} line={line} />
          ))}
        </ul>

        <div>
          <ClearCartButton />
        </div>
      </div>

      <div className="h-fit rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold">ملخص الطلب</h2>

        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex items-center justify-between">
            <dt className="text-muted-foreground">عدد القطع</dt>
            <dd data-numeric className="tabular-nums">
              {formatNumber(cart.count)}
            </dd>
          </div>
          <div className="flex items-center justify-between text-base font-medium">
            <dt>الإجمالي</dt>
            <dd data-numeric>{formatPrice(cart.subtotal)}</dd>
          </div>
        </dl>

        <Link
          href={ROUTES.checkout}
          className={cn(buttonVariants({ variant: "gold", size: "xl" }), "mt-4 w-full")}
        >
          الدفع عند الاستلام
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          الخطوة التالية: رقم الهاتف والعنوان، ثم تأكيد الطلب.
        </p>
      </div>
    </div>
  )
}
