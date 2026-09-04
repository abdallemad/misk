"use client"

import Image from "next/image"
import Link from "next/link"
import { useTransition } from "react"
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { removeCartItemAction } from "@/actions/cart/remove-cart-item"
import { updateCartItemAction } from "@/actions/cart/update-cart-item"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MAX_LINE_QUANTITY } from "@/constants/cart"
import { storeProductRoute } from "@/constants/routes"
import { DEFAULT_PRODUCT_IMAGE } from "@/constants/uploads"
import { formatPrice } from "@/utils/format"
import type { CartLine } from "@/services/cart.service"

/**
 * One row on `/cart` — image, name and option, a quantity stepper, the line
 * total, and a remove button.
 *
 * `useTransition` rather than `useActionState`: same reasoning as
 * `order-status-control.tsx` — this is a single value being written, not a
 * form with field errors, so a plain awaited call is simpler. There is no
 * client-side optimism beyond the pending spinner; the action revalidates
 * `/cart` and the row's real numbers come back on the next paint, which is
 * fast enough for a quantity nudge.
 */
export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition()
  const maxQuantity = Math.min(line.stock, MAX_LINE_QUANTITY)

  function setQuantity(next: number) {
    startTransition(async () => {
      const result = await updateCartItemAction(line.variantId, next)
      if (!result.ok) toast.error(result.message)
    })
  }

  function remove() {
    startTransition(async () => {
      const result = await removeCartItemAction(line.variantId)
      if (result.ok) toast.success("تمت إزالة العنصر من السلة.")
      else toast.error(result.message)
    })
  }

  return (
    <li className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      <Link
        href={storeProductRoute(line.productSlug)}
        className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-secondary sm:size-20"
      >
        <Image
          src={line.imageUrl ?? DEFAULT_PRODUCT_IMAGE}
          alt={line.productName}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="min-w-0 flex-1">
        <Link
          href={storeProductRoute(line.productSlug)}
          className="font-medium hover:underline"
        >
          {line.productName}
        </Link>
        <p className="text-xs text-muted-foreground">
          {line.label}
          {line.oilGrade ? ` · ${line.oilGrade}` : ""}
        </p>
        <p className="mt-1 text-sm font-medium sm:hidden" data-numeric>
          {formatPrice(line.lineTotal)}
        </p>
      </div>

      <div className="flex items-center gap-1.5" role="group" aria-label="الكمية">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={pending || line.quantity <= 1}
          onClick={() => setQuantity(line.quantity - 1)}
        >
          <MinusIcon aria-hidden="true" />
        </Button>
        <span className="flex w-6 items-center justify-center text-sm tabular-nums" data-numeric>
          {pending ? <Spinner className="size-3.5" /> : line.quantity}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={pending || line.quantity >= maxQuantity}
          onClick={() => setQuantity(line.quantity + 1)}
        >
          <PlusIcon aria-hidden="true" />
        </Button>
      </div>

      <p className="hidden w-24 text-end text-sm font-medium sm:block" data-numeric>
        {formatPrice(line.lineTotal)}
      </p>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-muted-foreground hover:text-destructive"
        disabled={pending}
        onClick={remove}
        aria-label={`إزالة ${line.productName} من السلة`}
      >
        <Trash2Icon aria-hidden="true" />
      </Button>
    </li>
  )
}
