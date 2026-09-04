import { StoreFooter, StoreHeader } from "@/components/store"

/**
 * `/cart` — shares the storefront chrome with `/store`.
 *
 * A separate layout rather than nesting `/cart` under `app/store/` — the URL
 * genuinely is `/cart` (see `docs/folder-structure.md`'s note on `store/` and
 * `admin/` for the same reasoning), and `StoreHeader` / `StoreFooter` are
 * already factored out precisely so more than one route can render them.
 */
export default function CartLayout({ children }: LayoutProps<"/cart">) {
  return (
    <>
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </>
  )
}
