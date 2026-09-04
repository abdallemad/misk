import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/store` — the storefront catalogue shell.
 *
 * A plain folder rather than a `(shop)` route group: the URL genuinely is
 * `/store`, so a group would only strip the segment and force it to be
 * re-added. The header and footer live in the layout so every future
 * `/store/*` page inherits them.
 */
export default function StoreLayout({ children }: LayoutProps<"/store">) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
