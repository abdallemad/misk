import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/checkout` — shares the storefront chrome with `/store` and `/cart`.
 *
 * Its own layout rather than nesting under `store/` or `cart/`, the same
 * reasoning both of those already give: the URL genuinely is `/checkout`.
 */
export default function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
