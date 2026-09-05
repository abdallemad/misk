"use client"

import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { MinusIcon, PlusIcon, ShoppingBagIcon } from "lucide-react"
import { toast } from "sonner"

import { addToCartAction } from "@/actions/cart/add-to-cart"
import { StockBadge } from "@/components/shared/status-badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { MAX_LINE_QUANTITY } from "@/constants/cart"
import { ROUTES } from "@/constants/routes"
import { formatPrice } from "@/utils/format"
import type { StoreVariant } from "@/services/catalog.service"

type AddToCartFormProps = {
  variants: StoreVariant[]
}

/**
 * The product page's buy box: **the `<select>` for the perfume's options**,
 * a quantity stepper, and «اشترِ الآن» / «أضف إلى السلة».
 *
 * **«اشترِ الآن» is wired up now.** It used to be disabled unconditionally —
 * checkout did not exist yet when this form was written, and "buy now" has
 * to lead somewhere. `/checkout` exists now, and this button already sits
 * behind a real `<select>` (unlike the catalogue card's own quick-add, which
 * has no picker and stays disabled for exactly that reason — see
 * `store-card-actions.tsx` and docs/cart-feature.md's "Extending this"). A
 * shopper who has already chosen a size here loses nothing by skipping the
 * cart page, so «اشترِ الآن» adds the selected variant and quantity to the
 * cart — the identical `addToCartAction` call «أضف إلى السلة» makes — and,
 * only on success, pushes to `/checkout`.
 *
 * **The two buttons do not share a `pending` flag.** An earlier version of
 * this form disabled both off one `useTransition`, which flashed a loading
 * spinner on «اشترِ الآن» whenever «أضف إلى السلة» was pressed — a button
 * that had not been touched and was not doing anything (see
 * docs/cart-feature.md). Each button now owns its own transition, so
 * pressing one never visually disturbs the other.
 */
export function AddToCartForm({ variants }: AddToCartFormProps) {
  const router = useRouter()

  const [pending, startTransition] = useTransition()
  const [buyNowPending, startBuyNowTransition] = useTransition()

  const firstAvailable = variants.find((variant) => variant.stock > 0)
  const [variantId, setVariantId] = useState<string | null>(
    (firstAvailable ?? variants[0])?.id ?? null
  )
  const [quantity, setQuantity] = useState(1)

  const selected = variants.find((variant) => variant.id === variantId) ?? null
  const outOfStock = !selected || selected.stock <= 0
  const maxQuantity = selected ? Math.min(selected.stock, MAX_LINE_QUANTITY) : 0

  function pickVariant(id: string) {
    setVariantId(id)
    setQuantity(1)
  }

  function addToCart() {
    if (!selected || outOfStock) return

    startTransition(async () => {
      const result = await addToCartAction({
        variantId: selected.id,
        quantity,
      })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      toast.success(quantity > 1 ? `أُضيف إلى السلة (${quantity}).` : "أُضيف إلى السلة.")
    })
  }

  /** Same `addToCartAction` call as «أضف إلى السلة», then straight to
   *  `/checkout` — a client-side push, not a `redirect()` inside the action:
   *  adding a line never empties the cart, so there is no page-level guard
   *  here for a server refresh to race (unlike `placeOrderAction`, see
   *  `place-order.ts`). */
  function buyNow() {
    if (!selected || outOfStock) return

    startBuyNowTransition(async () => {
      const result = await addToCartAction({
        variantId: selected.id,
        quantity,
      })

      if (!result.ok) {
        toast.error(result.message)
        return
      }

      router.push(ROUTES.checkout)
    })
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variant-select">الحجم / الخيار</Label>
        <Select
          items={variantItems(variants)}
          value={variantId}
          onValueChange={(value) => pickVariant(String(value))}
          disabled={pending || buyNowPending}
        >
          <SelectTrigger id="variant-select" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {variants.map((variant) => (
              <SelectItem
                key={variant.id}
                value={variant.id}
                disabled={variant.stock <= 0}
              >
                {variantOptionLabel(variant)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="الكمية">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() => setQuantity((value) => Math.max(1, value - 1))}
              disabled={pending || buyNowPending || outOfStock || quantity <= 1}
            >
              <MinusIcon aria-hidden="true" />
            </Button>
            <span className="w-6 text-center text-sm tabular-nums" data-numeric>
              {quantity}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              onClick={() =>
                setQuantity((value) => Math.min(maxQuantity, value + 1))
              }
              disabled={pending || buyNowPending || outOfStock || quantity >= maxQuantity}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>

          <StockBadge stock={selected.stock} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Its own transition (`buyNowPending`), not `pending` — so pressing
            «أضف إلى السلة» never spins this button, and vice versa. Both are
            still disabled while either is in flight, to stop a double-click
            firing two overlapping cart writes. */}
        <Button
          type="button"
          variant="gold"
          size="xl"
          className="flex-1"
          onClick={buyNow}
          disabled={pending || buyNowPending || outOfStock}
        >
          {buyNowPending ? <Spinner /> : null}
          اشترِ الآن
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="flex-1"
          onClick={addToCart}
          disabled={pending || buyNowPending || outOfStock}
        >
          {pending ? <Spinner /> : <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />}
          أضف إلى السلة
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {outOfStock
          ? "غير متوفر حاليًا — يُحضَّر عند الطلب."
          : "الدفع عند الاستلام — «اشترِ الآن» ينقلك مباشرة إلى إتمام الطلب."}
      </p>
    </div>
  )
}

function variantOptionLabel(variant: StoreVariant): string {
  const parts = [variant.label]
  if (variant.oilGrade) parts.push(variant.oilGrade)

  const price = formatPrice(variant.price)
  const suffix = variant.stock <= 0 ? " — نفد المخزون" : ""

  return `${parts.join(" · ")} — ${price}${suffix}`
}

/** `items` is what lets `<SelectValue>` render a label instead of the raw id. */
function variantItems(variants: StoreVariant[]) {
  return variants.map((variant) => ({
    value: variant.id,
    label: variantOptionLabel(variant),
  }))
}
