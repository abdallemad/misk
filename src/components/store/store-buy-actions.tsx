import { ShoppingBagIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type StoreBuyActionsProps = {
  outOfStock?: boolean
  /**
   * `card` — small, stacked, no caption — for the catalogue grid tile.
   * `page` (default) — full-size, side-by-side on `sm`, with a caption — for
   * the product page.
   */
  variant?: "page" | "card"
}

/**
 * "اشترِ الآن" and "أضف إلى السلة" — **both disabled on purpose**.
 *
 * The cart and checkout are not built yet (docs/folder-structure.md sketches
 * them as `cart-feature.md` / `checkout-orders-feature.md`). Showing the
 * buttons disabled — rather than hiding them — tells a shopper the perfume is
 * a real product and buying is coming, without pretending it works today. When
 * the cart lands, this component gains an `onClick` / a variant to add and
 * stops being a static server component.
 *
 * `outOfStock` swaps the caption on the product-page variant; the buttons are
 * disabled either way for now, so it only changes the wording.
 *
 * Rendered on the product page (`variant="page"`) and on every catalogue card
 * (`variant="card"`).
 */
export function StoreBuyActions({
  outOfStock = false,
  variant = "page",
}: StoreBuyActionsProps) {
  const card = variant === "card"
  const size = card ? "sm" : "xl"

  return (
    <div className="flex w-full flex-col gap-2">
      <div className={cn("flex flex-col gap-2", !card && "sm:flex-row")}>
        <Button
          type="button"
          variant="gold"
          size={size}
          className="flex-1"
          disabled
        >
          اشترِ الآن
        </Button>
        <Button
          type="button"
          variant="outline"
          size={size}
          className="flex-1"
          disabled
        >
          <ShoppingBagIcon data-icon="inline-start" aria-hidden="true" />
          أضف إلى السلة
        </Button>
      </div>

      {card ? null : (
        <p className="text-xs text-muted-foreground">
          {outOfStock
            ? "غير متوفر حاليًا — يُحضَّر عند الطلب."
            : "الشراء غير متاح بعد — السلة والدفع قيد الإنشاء."}
        </p>
      )}
    </div>
  )
}
