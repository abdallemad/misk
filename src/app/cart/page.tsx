import { CartContent } from "@/components/store/cart-content"
import { getCart } from "@/services/cart.service"

export const metadata = { title: "السلة" }

/**
 * `/cart` — the shopper's cart.
 *
 * A Server Component that reads `getCart()` directly, the storefront's
 * read-first exception. There is nothing to filter, search or page here — a
 * cart is one shopper's handful of lines — so this page skips the whole
 * list-page convention `/store` follows and is just a read plus a few small
 * client islands (`CartLineItem`, `ClearCartButton`) for the mutations.
 *
 * See docs/cart-feature.md.
 */
export default async function CartPage() {
  const cart = await getCart()

  return (
    <div className="mx-auto max-w-page px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="text-display-md sm:text-display-lg">السلة</h1>

      <div className="mt-8">
        <CartContent cart={cart} />
      </div>
    </div>
  )
}
