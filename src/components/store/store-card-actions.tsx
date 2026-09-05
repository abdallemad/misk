"use client"

import { useTransition } from "react"
import { ShoppingBagIcon } from "lucide-react"
import { toast } from "sonner"

import { addToCartAction } from "@/actions/cart/add-to-cart"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type StoreCardActionsProps = {
  /** `StoreProductCard.defaultVariantId` — `null` disables the add button. */
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
 * **«اشترِ الآن» is disabled unconditionally, on purpose, unlike the product
 * page's `AddToCartForm`.** That one wired its own «اشترِ الآن» up to
 * `/checkout` once checkout existed, because it sits behind a real `<select>`
 * — a shopper who buy-nows from there has already picked a size. This card
 * has no picker; a card's «اشترِ الآن» quick-adding `defaultVariantId` and
 * jumping straight to `/checkout` would skip the one screen (the product
 * page's `<select>`, or `/cart`) where a shopper can still change their mind
 * about size. See docs/cart-feature.md. Only «أضف إلى السلة» does anything
 * here.
 *
 * These buttons are siblings of the card's `<Link>` to the product page, not
 * nested inside it (`store-product-card.tsx` explains why) — so there is no
 * `preventDefault` dance here, just an ordinary click handler.
 */
export function StoreCardActions({ variantId }: StoreCardActionsProps) {
  const [pending, startTransition] = useTransition()

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

  return (
    <div className="flex w-full flex-col gap-2">
      {/* Disabled unconditionally — see AddToCartForm for why. */}
      <Button type="button" variant="gold" size="sm" className="flex-1" disabled>
        اشترِ الآن
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="flex-1"
        disabled={pending || !variantId}
        onClick={addToCart}
      >
        {pending ? <Spinner /> : <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />}
        أضف إلى السلة
      </Button>
    </div>
  )
}
