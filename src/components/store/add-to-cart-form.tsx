"use client"

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
import { formatPrice } from "@/utils/format"
import type { StoreVariant } from "@/services/catalog.service"

type AddToCartFormProps = {
  variants: StoreVariant[]
}

/**
 * The product page's buy box: **the `<select>` for the perfume's options**,
 * a quantity stepper, and «اشترِ الآن» / «أضف إلى السلة».
 *
 * A perfume always has at least one variant (`getStoreProduct` refuses to
 * return one with none), so a variant is always selected — defaulting to the
 * first one still in stock, so the picker does not open on a dead end.
 *
 * **«اشترِ الآن» is disabled unconditionally** — a real "buy now" has to lead
 * somewhere, and checkout/cash-on-delivery is not built yet (see
 * `/cart`'s own disabled confirm button). Only «أضف إلى السلة» does anything
 * right now: it calls `addToCartAction` from a plain `onClick` inside
 * `useTransition`, the same call `order-status-control.tsx` and
 * `delete-product-dialog.tsx` make for a single-value write — there is one
 * thing to submit (a variant id and a quantity, already in React state), so a
 * form is more machinery than this needs.
 */
export function AddToCartForm({ variants }: AddToCartFormProps) {
  const [pending, startTransition] = useTransition()

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

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border p-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="variant-select">الحجم / الخيار</Label>
        <Select
          items={variantItems(variants)}
          value={variantId}
          onValueChange={(value) => pickVariant(String(value))}
          disabled={pending}
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
              disabled={pending || outOfStock || quantity <= 1}
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
              disabled={pending || outOfStock || quantity >= maxQuantity}
            >
              <PlusIcon aria-hidden="true" />
            </Button>
          </div>

          <StockBadge stock={selected.stock} />
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        {/* Disabled unconditionally — no checkout to lead to yet. Not tied
            to `pending` at all, so it never shows the add-to-cart spinner. */}
        <Button type="button" variant="gold" size="xl" className="flex-1" disabled>
          اشترِ الآن
        </Button>
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="flex-1"
          onClick={addToCart}
          disabled={pending || outOfStock}
        >
          {pending ? <Spinner /> : <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />}
          أضف إلى السلة
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {outOfStock
          ? "غير متوفر حاليًا — يُحضَّر عند الطلب."
          : "الدفع عند الاستلام — «اشترِ الآن» قيد الإنشاء، أضف إلى السلة في الوقت الحالي."}
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
