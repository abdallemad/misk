"use client"

import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { ShoppingBagIcon } from "lucide-react"
import { toast } from "sonner"

import { addToCartAction } from "@/actions/cart/add-to-cart"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { ROUTES } from "@/constants/routes"

type StoreCardActionsProps = {
  /** `StoreProductCard.defaultVariantId` — `null` disables both buttons. */
  variantId: string | null
}

/**
 * Quick-add from the catalogue grid — one unit of the perfume's cheapest
 * in-stock option (`defaultVariantId`, computed in `catalog.service.ts`).
 *
 * A shopper who wants a *different* size opens the product page, where
 * `AddToCartForm` has the full picker; the card can only ever act on one
 * variant, so it acts on the obvious one rather than guessing further.
 *
 * **«اشترِ الآن» adds `defaultVariantId` and goes straight to `/checkout`** —
 * the identical `addToCartAction` call «أضف إلى السلة» makes, same
 * own-transition-per-button split as `AddToCartForm` (so pressing one button
 * never spins the other's icon).
 *
 * These buttons are siblings of the card's `<Link>` to the product page, not
 * nested inside it (`store-product-card.tsx` explains why) — so there is no
 * `preventDefault` dance here, just an ordinary click handler.
 */
export function StoreCardActions({ variantId }: StoreCardActionsProps) {
  const router = useRouter()

  const [pending, startTransition] = useTransition()
  const [buyNowPending, startBuyNowTransition] = useTransition()

  function addToCart() {
    if (!variantId) return

    startTransition(async () => {
      const result = await addToCartAction({ variantId, quantity: 1 })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success("أُضيف إلى السلة.")
    })
  }

  function buyNow() {
    if (!variantId) return

    startBuyNowTransition(async () => {
      const result = await addToCartAction({ variantId, quantity: 1 })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      router.push(ROUTES.checkout)
    })
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <Button
        type="button"
        variant="gold"
        size="sm"
        className="flex-1"
        disabled={pending || buyNowPending || !variantId}
        onClick={buyNow}
      >
        {buyNowPending ? <Spinner /> : null}
        اشترِ الآن
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={pending || buyNowPending || !variantId}
        onClick={addToCart}
      >
        {pending ? <Spinner /> : <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />}
        أضف إلى السلة
      </Button>
    </div>
  )
}
