import { auth } from "@clerk/nextjs/server"

import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/account/*` — shares the storefront chrome with `/store`, `/cart` and
 * `/checkout`. Session-gated here with `auth.protect()` — see `proxy.ts` for
 * why that moved out of the proxy layer and into the layout. A page under
 * this layout still calls `getCurrentUser()` itself where it needs the row,
 * not just the fact of being signed in.
 */
export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  await auth.protect()

  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
