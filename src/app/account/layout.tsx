import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/account/*` — shares the storefront chrome with `/store`, `/cart` and
 * `/checkout`. Proxy-protected as a whole (`proxy.ts`); nothing extra to
 * check here — a page under this layout still calls `getCurrentUser()`
 * itself where it needs the row, not just the fact of being signed in.
 */
export default function AccountLayout({ children }: LayoutProps<"/account">) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
