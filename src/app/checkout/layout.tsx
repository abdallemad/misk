import { auth } from "@clerk/nextjs/server"

import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/checkout` — shares the storefront chrome with `/store` and `/cart`.
 *
 * Session-gated here with `auth.protect()` — see `proxy.ts` for why that
 * moved out of the proxy layer and into the layout.
 *
 * Its own layout rather than nesting under `store/` or `cart/`, the same
 * reasoning both of those already give: the URL genuinely is `/checkout`.
 */
export default async function CheckoutLayout({ children }: LayoutProps<"/checkout">) {
  await auth.protect()

  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
